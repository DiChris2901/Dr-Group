import React, { useState, useEffect } from 'react';
import { fCurrency } from '../../utils/formatNumber';
import { calculateMonthlyAccountBalance } from '../../utils/monthlyBalanceUtils';
import {
  createLocalDate,
  formatPaymentDate,
  formatDateForInput,
  getStatusColor,
  getStatusText,
  formatCurrency,
  cleanCurrency,
  isColjuegosCommitment,
  imageToPdf,
  combineFilesToPdf
} from './paymentsHelpers';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  TextField,
  alpha,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Business as CompanyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { doc, updateDoc, getDoc, deleteDoc, collection, query, orderBy, getDocs, addDoc, where, deleteField } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';

/**
 * EditPaymentDialog - Extracted from PaymentsPage.jsx
 * Handles editing, file upload, and deletion of payments.
 */
const EditPaymentDialog = ({
  open,
  payment,
  onClose,
  companies,
  personalAccounts,
  incomes,
  payments,
  showNotification,
  currentUser,
  userProfile,
  isAdmin,
  logActivity,
}) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  // Edit form state
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    concept: '',
    amount: '',
    method: '',
    notes: '',
    reference: '',
    date: '',
    companyName: '',
    provider: '',
    interests: '',
    interesesDerechosExplotacion: '',
    interesesGastosAdministracion: '',
    derechosExplotacion: '',
    gastosAdministracion: '',
    originalAmount: '',
    sourceAccount: '',
    sourceBank: '',
    tax4x1000: 0
  });

  // Commitment data
  const [loadingCommitment, setLoadingCommitment] = useState(false);
  const [commitmentData, setCommitmentData] = useState(null);

  // Delete confirmation
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // File upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);


  const loadCommitmentData = async (commitmentId) => {
    if (!commitmentId) return null;
    
    try {
      setLoadingCommitment(true);
      const commitmentRef = doc(db, 'commitments', commitmentId);
      const commitmentSnap = await getDoc(commitmentRef);
      
      if (commitmentSnap.exists()) {
        const data = commitmentSnap.data();
        setCommitmentData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error cargando compromiso:', error);
      return null;
    } finally {
      setLoadingCommitment(false);
    }
  };



  // Initialize form when payment prop changes
  useEffect(() => {
    if (open && payment) {
      handleEditPayment(payment);
    }
    if (!open) {
      // Reset state when dialog closes
      setEditingPayment(null);
      setCommitmentData(null);
      setSelectedFiles([]);
      setDragActive(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [open, payment]);

  const handleEditPayment = async (payment) => {
    setEditingPayment(payment);
    
    // Cargar datos del compromiso si existe commitmentId
    let providerName = '';
    let commitment = null;
    if (payment.commitmentId) {
      commitment = await loadCommitmentData(payment.commitmentId);
      providerName = commitment?.provider || commitment?.beneficiary || '';
    }
    
    // Determinar si es Coljuegos para mostrar campos especÃ­ficos
    const isColjuegos = isColjuegosCommitment(commitment);
    
    // ðŸ” DEBUG VALORES EXACTOS COMO EN EL MODAL
    
    // Crear copia del pago para trabajar
    let correctedPayment = { ...payment };
    
    // ðŸ”§ CORRECCIÃ“N AUTOMÃTICA DESACTIVADA TEMPORALMENTE
    // (Se puede reactivar mÃ¡s adelante si es necesario)
    /*
    // Si es un pago de Coljuegos pero los campos especÃ­ficos estÃ¡n en 0 o undefined
    if (isColjuegos && (!payment.interesesDerechosExplotacion && !payment.interesesGastosAdministracion) && payment.interests > 0) {
      
      // Dividir interests entre derechos y gastos (50/50 como patrÃ³n comÃºn)
      const halfInterests = Math.round(payment.interests / 2);
      correctedPayment = {
        ...payment,
        interesesDerechosExplotacion: halfInterests,
        interesesGastosAdministracion: payment.interests - halfInterests,
        originalAmount: payment.amount - payment.interests
      };
      
    }
    // Si es Coljuegos pero no tiene interests ni campos separados, calcular desde commitment
    else if (isColjuegos && !payment.interests && commitment) {
      
      const totalInterests = payment.amount - (commitment.amount || 0);
      if (totalInterests > 0) {
        const halfInterests = Math.round(totalInterests / 2);
        correctedPayment = {
          ...payment,
          interesesDerechosExplotacion: halfInterests,
          interesesGastosAdministracion: totalInterests - halfInterests,
          originalAmount: payment.amount - totalInterests,
          interests: totalInterests
        };
        
      }
    }
    */
    
    // === LÃ“GICA ALINEADA CON PaymentReceiptViewer ===
    const baseOriginal = (
      commitment?.baseAmount ||
      correctedPayment.originalCommitmentAmount ||
      commitment?.originalAmount ||
      commitment?.amount ||
      correctedPayment.originalAmount ||
      0
    );
    const ivaOriginal = commitment?.iva || 0;
    const interesesNormales = isColjuegos ? 0 : (commitment?.intereses || commitment?.interests || correctedPayment.intereses || correctedPayment.interests || 0);

    setEditFormData({
      concept: correctedPayment.concept || '',
      amount: fCurrency(correctedPayment.amount || 0),
      method: correctedPayment.method || '',
      notes: correctedPayment.notes || '',
      reference: correctedPayment.reference || '',
      companyName: correctedPayment.companyName || '',
      provider: providerName,
      interests: isColjuegos ? '' : fCurrency(interesesNormales),
      // âœ… SIEMPRE cargar los valores de Coljuegos si existen (para preservarlos)
      interesesDerechosExplotacion: fCurrency(correctedPayment.interesesDerechosExplotacion ?? commitment?.interesesDerechosExplotacion ?? 0),
      interesesGastosAdministracion: fCurrency(correctedPayment.interesesGastosAdministracion ?? commitment?.interesesGastosAdministracion ?? 0),
      derechosExplotacion: fCurrency(correctedPayment.derechosExplotacion ?? commitment?.derechosExplotacion ?? 0),
      gastosAdministracion: fCurrency(correctedPayment.gastosAdministracion ?? commitment?.gastosAdministracion ?? 0),
      originalAmount: fCurrency(baseOriginal + ivaOriginal), // Monto original (base + IVA)
      baseOriginal: fCurrency(baseOriginal),
      ivaOriginal: fCurrency(ivaOriginal),
      sourceAccount: correctedPayment.sourceAccount || '',
      sourceBank: correctedPayment.sourceBank || '',
      date: formatDateForInput(correctedPayment.date),
      tax4x1000: calculate4x1000Visual(
        correctedPayment.amount || 0,
        correctedPayment.method || '',
        correctedPayment.sourceAccount || ''
      )
    });

    
    // ðŸ”„ ACTUALIZACIÃ“N AUTOMÃTICA DE FIREBASE DESACTIVADA
    /*
    if (correctedPayment !== payment) {
      try {
        const paymentRef = doc(db, 'payments', payment.id);
        await updateDoc(paymentRef, {
          interesesDerechosExplotacion: correctedPayment.interesesDerechosExplotacion || 0,
          interesesGastosAdministracion: correctedPayment.interesesGastosAdministracion || 0,
          originalAmount: correctedPayment.originalAmount || correctedPayment.amount,
          interests: correctedPayment.interests || 0,
          updatedAt: new Date()
        });
        
        showNotification('Datos de intereses corregidos automÃ¡ticamente', 'success');
      } catch (error) {
        console.error('âŒ Error al actualizar pago:', error);
        showNotification('Error al corregir datos automÃ¡ticamente', 'error');
      }
    }
    */
    
    // open is controlled by parent via props
  };

  // FunciÃ³n para obtener cuentas bancarias de todas las empresas
  const getBankAccounts = () => {
    const accounts = [];
    
    // Agregar cuentas empresariales
    companies.forEach(company => {
      // La estructura de datos usa bankAccount y bankName (singular), no bankAccounts (array)
      if (company.bankAccount && company.bankName) {
        accounts.push({
          account: company.bankAccount,
          bank: company.bankName,
          companyName: company.name,
          type: 'Empresarial'
        });
      }
    });

    // Agregar cuentas personales desde Firebase
    personalAccounts.forEach(account => {
      if (account.accountNumber && account.bankName) {
        accounts.push({
          account: account.accountNumber,
          bank: account.bankName,
          companyName: account.holderName || 'Personal',
          type: 'Personal'
        });
      }
    });

    // Ordenar: primero empresariales, luego personales
    return accounts.sort((a, b) => {
      if (a.type === 'Empresarial' && b.type === 'Personal') return -1;
      if (a.type === 'Personal' && b.type === 'Empresarial') return 1;
      return a.companyName?.localeCompare(b.companyName) || 0;
    });
  };

  // FunciÃ³n para manejar la selecciÃ³n de cuenta bancaria
  const handleSourceAccountSelect = (event) => {
    const selectedAccount = event.target.value;
    const accountInfo = getBankAccounts().find(acc => acc.account === selectedAccount);
    
    setEditFormData(prev => ({
      ...prev,
      sourceAccount: selectedAccount,
      sourceBank: accountInfo ? accountInfo.bank : ''
    }));
  };

  // FunciÃ³n para calcular balance de una cuenta especÃ­fica (SOLO MES ACTUAL - RESET MENSUAL)
  const calculateAccountBalance = (accountNumber) => {
    // ðŸ—“ï¸ NUEVO: Usar utilidad de balance mensual para reset automÃ¡tico
    // Calcular balance solo con transacciones del mes actual
    const monthlyBalance = calculateMonthlyAccountBalance(accountNumber, incomes, payments);
    
    return monthlyBalance;
  };

  // FunciÃ³n para formatear moneda
  const formatCurrencyBalance = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ðŸ’° FunciÃ³n para calcular 4x1000 visual
  const calculate4x1000Visual = (amount, method, sourceAccount) => {
    // 4x1000 se aplica a TODOS los pagos que requieren movimiento bancario
    // Para mÃ©todos como "Efectivo", se asume retiro de cuenta bancaria
    if (amount > 0) {
      return Math.round((amount * 4) / 1000);
    }
    return 0;
  };

  // ðŸ”„ useEffect para calcular 4x1000 automÃ¡ticamente en formulario de ediciÃ³n
  useEffect(() => {
    const tax4x1000Amount = calculate4x1000Visual(
      editFormData.amount, 
      editFormData.method, 
      editFormData.sourceAccount
    );
    
    if (tax4x1000Amount !== editFormData.tax4x1000) {
      setEditFormData(prev => ({
        ...prev,
        tax4x1000: tax4x1000Amount
      }));
    }
  }, [editFormData.amount, editFormData.method, editFormData.sourceAccount]);

  // FunciÃ³n para calcular y crear registro del 4x1000
  const create4x1000Record = async (paymentAmount, sourceAccount, sourceBank, companyName, paymentDate) => {
    // Calcular 4x1000: 4 pesos por cada 1000 pesos transferidos
    const tax4x1000 = Math.round((paymentAmount * 4) / 1000);
    
    // Solo crear si el impuesto es mayor a 0
    if (tax4x1000 <= 0) return null;

    try {
      // Crear registro del 4x1000 como un pago adicional
      const tax4x1000Data = {
        concept: '4x1000 - Impuesto Gravamen Movimientos Financieros',
        amount: tax4x1000,
        originalAmount: tax4x1000,
        method: 'Transferencia',
        notes: `Impuesto 4x1000 generado automÃ¡ticamente (${formatCurrencyBalance(paymentAmount)} x 0.004)`,
        reference: `4x1000-${Date.now()}`,
        companyName: companyName,
        sourceAccount: sourceAccount,
        sourceBank: sourceBank,
        date: paymentDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        is4x1000Tax: true, // Flag para identificar registros de 4x1000
        relatedToPayment: true, // Flag para indicar que es un impuesto relacionado
        tags: ['impuesto', '4x1000', 'automatico']
      };

      // Agregar a la colecciÃ³n de pagos
      const docRef = await addDoc(collection(db, 'payments'), tax4x1000Data);
      
      // ðŸ“ Registrar actividad de auditorÃ­a
      await logActivity('create_payment', 'payment', docRef.id, {
        concept: tax4x1000Data.concept,
        amount: tax4x1000,
        paymentMethod: 'Transferencia',
        companyName: companyName || 'Sin empresa',
        isAutomatic: true,
        is4x1000Tax: true,
        relatedToAmount: paymentAmount
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      return tax4x1000;
    } catch (error) {
      console.error('âŒ Error creando registro 4x1000:', error);
      return null;
    }
  };

  // FunciÃ³n para cerrar el modal de ediciÃ³n
  const handleCloseEditPayment = () => {
    setEditingPayment(null);
    setCommitmentData(null);
    setSelectedFiles([]); // Limpiar archivos seleccionados
    setDragActive(false); // Reset drag state
    setUploading(false); // Reset upload state
    setUploadProgress(0); // Reset progress
    setEditFormData({
      concept: '',
      amount: '',
      method: '',
      notes: '',
      reference: '',
      date: '',
      companyName: '',
      provider: '',
      interests: '',
      interesesDerechosExplotacion: '',
      interesesGastosAdministracion: '',
      originalAmount: '',
      sourceAccount: '',
      sourceBank: '',
      tax4x1000: 0
    });
  };

  // FunciÃ³n para guardar los cambios del pago
  const handleSavePayment = async () => {
    if (!editingPayment || !editFormData.concept.trim() || !editFormData.amount) {
      showNotification('Por favor completa los campos obligatorios', 'warning');
      return;
    }

    try {
      setUploadingFile(true);
      
      const paymentRef = doc(db, 'payments', editingPayment.id);
      
      // Determinar si es Coljuegos para guardar campos especÃ­ficos
      const isColjuegos = isColjuegosCommitment(commitmentData);
      
      // ðŸ“¦ Construir actualizaciÃ³n PARCIAL (solo campos realmente cambiados)
      const updateData = { updatedAt: new Date() };

      // Helpers de comparaciÃ³n
      const normalizeNumber = (val) => {
        const n = typeof val === 'string' ? parseFloat(cleanCurrency(val)) : Number(val);
        return Number.isFinite(n) ? n : undefined;
      };
      const normalizeDate = (val) => {
        if (!val) return undefined;
        const d = createLocalDate(val);
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
        d.setHours(0,0,0,0);
        return d;
      };
      const normalizeExistingDate = (val) => {
        if (!val) return undefined;
        const d = val.toDate ? val.toDate() : new Date(val);
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
        d.setHours(0,0,0,0);
        return d;
      };
      const addIfChangedStr = (key, newVal, oldVal) => {
        const a = (newVal ?? '').trim();
        const b = (oldVal ?? '').trim();
        if (a !== b) updateData[key] = a;
      };
      const addIfChangedNum = (key, newValRaw, oldValRaw) => {
        const a = normalizeNumber(newValRaw);
        const b = normalizeNumber(oldValRaw);
        if (a !== undefined && a !== b) updateData[key] = a;
      };
      const addIfChangedDate = (key, newValRaw, oldValRaw) => {
        const a = normalizeDate(newValRaw);
        const b = normalizeExistingDate(oldValRaw);
        if (a && (!b || a.getTime() !== b.getTime())) updateData[key] = a;
      };

      // Cadenas
      addIfChangedStr('concept', editFormData.concept, editingPayment.concept);
      addIfChangedStr('method', editFormData.method, editingPayment.method);
      addIfChangedStr('notes', editFormData.notes, editingPayment.notes);
      addIfChangedStr('reference', editFormData.reference, editingPayment.reference);
      addIfChangedStr('companyName', editFormData.companyName, editingPayment.companyName);
      addIfChangedStr('sourceAccount', editFormData.sourceAccount, editingPayment.sourceAccount);
      addIfChangedStr('sourceBank', editFormData.sourceBank, editingPayment.sourceBank);

      // NÃºmeros
      addIfChangedNum('amount', editFormData.amount, editingPayment.amount);
      addIfChangedNum('originalAmount', editFormData.originalAmount, editingPayment.originalAmount);

      // Fecha
      addIfChangedDate('date', editFormData.date, editingPayment.date);

      // âœ… AGREGAR CAMPOS DE INTERESES SOLO SI ES COLJUEGOS
      // Si NO es Coljuegos, NO incluir estos campos en updateData para preservar valores existentes
      if (isColjuegos) {
        // Es Coljuegos: actualizar SOLO los campos que cambian
        addIfChangedNum('interesesDerechosExplotacion', editFormData.interesesDerechosExplotacion, editingPayment.interesesDerechosExplotacion);
        addIfChangedNum('interesesGastosAdministracion', editFormData.interesesGastosAdministracion, editingPayment.interesesGastosAdministracion);
        addIfChangedNum('derechosExplotacion', editFormData.derechosExplotacion, editingPayment.derechosExplotacion);
        addIfChangedNum('gastosAdministracion', editFormData.gastosAdministracion, editingPayment.gastosAdministracion);

        // Intereses totales (derivado) - recalcular sÃ³lo si cambian sus componentes o si interests mismo cambiÃ³
        const newInterests = (normalizeNumber(editFormData.interesesDerechosExplotacion) || 0) + (normalizeNumber(editFormData.interesesGastosAdministracion) || 0);
        const oldInterests = normalizeNumber(editingPayment.interests) || 0;
        if (newInterests !== oldInterests) updateData.interests = newInterests;
      } else {
        // NO Coljuegos: actualizar sÃ³lo interests normal si cambiÃ³
        addIfChangedNum('interests', editFormData.interests, editingPayment.interests);
        // No tocar campos especÃ­ficos de Coljuegos
      }

      // Si no hay cambios en updateData (mÃ¡s allÃ¡ de updatedAt) y no hay archivos, evitar write
      const keysToWrite = Object.keys(updateData).filter(k => k !== 'updatedAt');
      if (keysToWrite.length === 0 && selectedFiles.length === 0) {
        setUploadingFile(false);
        showNotification('No hay cambios para guardar', 'info');
        return;
      }

      // =====================================================
      // SUBIR COMPROBANTES SELECCIONADOS (SI LOS HAY)
      // =====================================================
      if (selectedFiles.length > 0) {
        setUploadProgress(10);
        
        try {
          let fileToUpload;
          let fileName;

          if (selectedFiles.length === 1) {
            // Un solo archivo
            fileToUpload = selectedFiles[0].file;
            fileName = selectedFiles[0].name;
          } else {
            // MÃºltiples archivos - combinar en PDF
            setUploadProgress(25);
            showNotification('Combinando archivos en PDF Ãºnico...', 'info');
            
            const combinedPdf = await combineFilesToPdf(selectedFiles);
            fileToUpload = combinedPdf;
            fileName = `comprobantes_editado_${Date.now()}.pdf`;
          }

          // Subir a Firebase Storage
          setUploadProgress(50);
          const timestamp = Date.now();
          const finalFileName = `payments/${timestamp}_${fileName}`;
          const storageRef = ref(storage, finalFileName);
          
          const snapshot = await uploadBytes(storageRef, fileToUpload);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          setUploadProgress(75);

          // Agregar URLs de comprobantes al updateData
          updateData.attachments = [downloadURL];
          updateData.receiptUrls = [downloadURL];
          updateData.receiptUrl = downloadURL;

          // Actualizar estado local para mostrar inmediatamente
          setEditingPayment(prev => ({
            ...prev,
            attachments: [downloadURL],
            receiptUrls: [downloadURL],
            receiptUrl: downloadURL
          }));

          // Limpiar archivos seleccionados
          setSelectedFiles([]);
          
        } catch (uploadError) {
          console.error('âŒ Error subiendo comprobantes:', uploadError);
          showNotification(`Error subiendo comprobantes: ${uploadError.message}`, 'error');
          setUploadingFile(false);
          setUploadProgress(0);
          return; // Detener ejecuciÃ³n si falla la subida
        }
      }

      // Actualizar documento en Firestore
      setUploadProgress(90);
      await updateDoc(paymentRef, updateData);
      
      // ðŸ“ Registrar actividad de auditorÃ­a (sin undefineds)
      const activityDetails = {
        concept: updateData.concept ?? editingPayment.concept ?? 'Sin concepto',
        amount: updateData.amount ?? editingPayment.amount ?? 0,
        originalAmount: updateData.originalAmount ?? editingPayment.originalAmount ?? editingPayment.amount ?? 0,
        companyName: (updateData.companyName ?? editingPayment.companyName) || 'Sin empresa',
        paymentMethod: updateData.method ?? editingPayment.method ?? '',
        hasNewAttachments: selectedFiles.length > 0,
        attachmentCount: selectedFiles.length,
        isColjuegos: isColjuegos,
        interestsPaid: updateData.interests ?? editingPayment.interests ?? 0
      };
      // Eliminar claves con undefined explÃ­citamente (seguridad)
      Object.keys(activityDetails).forEach(k => activityDetails[k] === undefined && delete activityDetails[k]);

      await logActivity('update_payment', 'payment', editingPayment.id, activityDetails, 
        currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      // =====================================================
      // GENERAR 4x1000 AUTOMÃTICAMENTE (SI APLICA)
      // =====================================================
      // Solo generar 4x1000 si:
      // 1. Es transferencia bancaria o PSE
      // 2. Tiene cuenta de origen definida
      // 3. El monto es mayor a 0
      if ((updateData.method === 'Transferencia' || updateData.method === 'PSE') && 
          updateData.sourceAccount && 
          updateData.amount > 0) {
        
        
        const tax4x1000Amount = await create4x1000Record(
          updateData.amount,
          updateData.sourceAccount,
          updateData.sourceBank,
          updateData.companyName,
          updateData.date
        );

        if (tax4x1000Amount) {
        }
      }
      
      setUploadProgress(100);

      showNotification(
        selectedFiles.length > 0 
          ? `Pago actualizado y ${selectedFiles.length > 1 ? 'comprobantes combinados' : 'comprobante'} subido exitosamente`
          : 'Pago actualizado exitosamente', 
        'success'
      );
      
      handleCloseDialog();
    } catch (error) {
      console.error('âŒ Error al actualizar pago:', error);
      showNotification(`Error al actualizar pago: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // FunciÃ³n para eliminar un pago completo
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    setDeletingPayment(true);
    
    // âœ… FIXED: Declarar tax4x1000Records fuera del try-catch para que estÃ© disponible en toda la funciÃ³n
    let tax4x1000Records = [];
    
    try {
      
      // 1. Eliminar comprobantes de Firebase Storage si existen
      if (paymentToDelete.attachments && paymentToDelete.attachments.length > 0) {
        for (const attachmentUrl of paymentToDelete.attachments) {
          try {
            const storageRef = ref(storage, attachmentUrl);
            await deleteObject(storageRef);
          } catch (storageError) {
            // âœ… MEJORADO: Manejo especÃ­fico para diferentes tipos de errores
            if (storageError.code === 'storage/object-not-found') {
            } else if (storageError.code === 'storage/unauthorized') {
            } else {
            }
            // Continuar aunque falle eliminar el archivo - no es crÃ­tico
          }
        }
      }
      
      // 2. Buscar y eliminar registros de 4x1000 asociados
      try {
        // Buscar registros de 4x1000 que coincidan con el concepto y fecha del pago
        const paymentsQuery = query(
          collection(db, 'payments'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(paymentsQuery);
        // âœ… FIXED: Reasignar el array en lugar de declarar uno nuevo
        tax4x1000Records = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Identificar registros de 4x1000 por concepto y fecha similar
          if (data.concept && data.concept.includes('4x1000') && data.is4x1000Tax === true) {
            // Verificar si la fecha es del mismo dÃ­a que el pago original
            const paymentDate = paymentToDelete.date?.toDate?.() || new Date(paymentToDelete.date);
            const taxDate = data.date?.toDate?.() || new Date(data.date);
            
            const isSameDay = paymentDate.toDateString() === taxDate.toDateString();
            const isSimilarAmount = Math.abs(data.amount - Math.round((paymentToDelete.amount * 4) / 1000)) < 10;
            
            if (isSameDay && isSimilarAmount) {
              tax4x1000Records.push({ id: doc.id, data });
            }
          }
        });
        
        // Eliminar registros de 4x1000 encontrados
        if (tax4x1000Records.length > 0) {
          for (const record of tax4x1000Records) {
            await deleteDoc(doc(db, 'payments', record.id));
          }
        } else {
        }
        
      } catch (error) {
        console.error('âš ï¸ Error al eliminar registros de 4x1000:', error);
        // Continuar aunque falle la eliminaciÃ³n de 4x1000
      }
      
      // 3. Actualizar compromiso relacionado como no pagado
      if (paymentToDelete.commitmentId) {
        try {
          // Verificar si existen otros pagos para este compromiso (excluyendo 4x1000)
          const otherPaymentsQuery = query(
            collection(db, 'payments'),
            where('commitmentId', '==', paymentToDelete.commitmentId)
          );
          
          const otherPaymentsSnapshot = await getDocs(otherPaymentsQuery);
          const hasOtherValidPayments = otherPaymentsSnapshot.docs.some(doc => {
            const data = doc.data();
            return doc.id !== paymentToDelete.id && !data.is4x1000Tax; // Excluir el que estamos eliminando y los 4x1000
          });
          
          // Si no hay otros pagos vÃ¡lidos, marcar compromiso como no pagado
          if (!hasOtherValidPayments) {
            const commitmentRef = doc(db, 'commitments', paymentToDelete.commitmentId);

            // Leer el compromiso para recalcular estado y saldo
            let newStatus = 'pending';
            let restoredAmount = 0;
            try {
              const commitmentSnap = await getDoc(commitmentRef);
              if (commitmentSnap.exists()) {
                const cData = commitmentSnap.data();
                restoredAmount = cData.amount || cData.originalAmount || 0;
                const rawDue = cData.dueDate?.toDate?.() || cData.dueDate;
                if (rawDue) {
                  const due = new Date(rawDue);
                  due.setHours(0,0,0,0);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  if (due < today) newStatus = 'overdue';
                }
              }
            } catch(readCommitmentErr) {
            }

            await updateDoc(commitmentRef, {
              isPaid: false,
              paid: false,
              status: newStatus,            // Revertir a pending/overdue segÃºn fecha
              paymentStatus: deleteField(),  // Eliminar posibles flags previos
              totalPaid: deleteField(),      // Limpia acumulados de pagos
              remainingBalance: restoredAmount, // Restaura saldo completo
              lastPaymentId: deleteField(),
              lastPaymentAmount: deleteField(),
              lastPaymentDate: deleteField(),
              paymentDate: deleteField(),
              paidAt: deleteField(),
              paymentAmount: deleteField(),
              paymentId: deleteField(),
              interestPaid: deleteField(),
              paymentMethod: deleteField(),
              paymentReference: deleteField(),
              paymentNotes: deleteField(),
              receiptUrl: deleteField(),
              receiptUrls: deleteField(),
              receiptMetadata: deleteField(),
              updatedAt: new Date()
            });
          } else {
          }
          
        } catch (commitmentError) {
          console.error('âš ï¸ Error actualizando estado del compromiso:', commitmentError);
          // No detener la eliminaciÃ³n del pago por este error
        }
      }
      
      // 4. Eliminar el documento del pago de Firestore
      const paymentRef = doc(db, 'payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      
      // ðŸ“ Registrar actividad de auditorÃ­a
      await logActivity('delete_payment', 'payment', paymentToDelete.id, {
        concept: paymentToDelete.concept || 'Pago sin concepto',
        amount: paymentToDelete.amount || 0,
        companyName: paymentToDelete.companyName || paymentToDelete.company || 'Sin empresa',
        commitmentId: paymentToDelete.commitmentId || null,
        paymentMethod: paymentToDelete.paymentMethod || 'No especificado',
        had4x1000: tax4x1000Records.length > 0,
        deleted4x1000Count: tax4x1000Records.length,
        performedByRole: userProfile?.role || 'unknown',
        performedByIsAdmin: isAdmin
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      showNotification('Pago eliminado y compromiso actualizado correctamente', 'success');
      
      // 6. Limpiar cachÃ© de compromisos para forzar actualizaciÃ³n
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_COMMITMENTS_CACHE' });
      }
      
      // 7. Cerrar modal y limpiar estado
      setDeletePaymentDialogOpen(false);
      setPaymentToDelete(null);
      handleCloseDialog();
      
    } catch (error) {
      console.error('âŒ Error al eliminar pago:', error);
      showNotification(`Error al eliminar pago: ${error.message}`, 'error');
    } finally {
      setDeletingPayment(false);
    }
  };

  // FunciÃ³n para abrir diÃ¡logo de confirmaciÃ³n de eliminaciÃ³n
  const handleOpenDeletePayment = (payment) => {
    setPaymentToDelete(payment || editingPayment);
    setDeletePaymentDialogOpen(true);
  };

  // FunciÃ³n para cerrar diÃ¡logo de eliminaciÃ³n
  const handleCloseDeletePayment = () => {
    setDeletePaymentDialogOpen(false);
    setPaymentToDelete(null);
  };

  // FunciÃ³n para manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Formateo especial para campos de monto
    if (name === 'amount' || name === 'interests' || name === 'originalAmount' || 
        name === 'interesesDerechosExplotacion' || name === 'interesesGastosAdministracion') {
      const formattedValue = formatCurrency(value);
      
      setEditFormData(prev => {
        const newData = {
          ...prev,
          [name]: formattedValue
        };
        
        // Si se actualizÃ³ el amount, recalcular 4x1000 automÃ¡ticamente
        if (name === 'amount') {
          const numericAmount = parseFloat(formattedValue?.toString().replace(/[^\d.-]/g, '') || 0);
          newData.tax4x1000 = calculate4x1000Visual(numericAmount, prev.method, prev.sourceAccount);
        }
        
        return newData;
      });
    } else {
      setEditFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // Si se actualizÃ³ el mÃ©todo o cuenta origen, recalcular 4x1000
        if (name === 'method' || name === 'sourceAccount') {
          const numericAmount = parseFloat(prev.amount?.toString().replace(/[^\d.-]/g, '') || 0);
          newData.tax4x1000 = calculate4x1000Visual(numericAmount, 
            name === 'method' ? value : prev.method, 
            name === 'sourceAccount' ? value : prev.sourceAccount
          );
        }
        
        return newData;
      });
    }
  };

  // FunciÃ³n para manejar selecciÃ³n de archivos
  const handleFiles = (newFiles) => {
    // Filtrar solo archivos de imagen y PDF
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== newFiles.length) {
      showNotification('Solo se permiten imÃ¡genes (JPG, PNG) y PDFs menores a 10MB', 'warning');
    }

    setSelectedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
      url: null
    }))]);
  };

  // Funciones para drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFilesArray = Array.from(e.target.files);
    handleFiles(selectedFilesArray);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // FunciÃ³n para subir archivos combinados
  const uploadCombinedFiles = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Por favor selecciona al menos un archivo', 'warning');
      return;
    }

    if (!editingPayment) {
      showNotification('Error: No se encontrÃ³ el pago a editar', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      let fileToUpload;
      let fileName;

      if (selectedFiles.length === 1) {
        // Si solo hay un archivo, subirlo directamente
        fileToUpload = selectedFiles[0].file;
        fileName = selectedFiles[0].name;
      } else {
        // Si hay mÃºltiples archivos, combinarlos en un PDF
        setUploadProgress(25);
        showNotification('Combinando archivos en PDF Ãºnico...', 'info');

        const combinedPdf = await combineFilesToPdf(selectedFiles);
        fileToUpload = combinedPdf;
        fileName = `comprobantes_editado_${Date.now()}.pdf`;
        
        setUploadProgress(50);
      }

      // Crear referencia para el archivo
      const timestamp = Date.now();
      const finalFileName = `payments/${timestamp}_${fileName}`;
      const storageRef = ref(storage, finalFileName);

      setUploadProgress(75);

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);

      // Actualizar el pago con el nuevo comprobante
      if (editingPayment) {
        const paymentRef = doc(db, 'payments', editingPayment.id);
        const updateData = {
          attachments: [downloadURL],
          receiptUrls: [downloadURL],
          receiptUrl: downloadURL,
          updatedAt: new Date()
        };
        
        await updateDoc(paymentRef, updateData);

        // Actualizar el estado local del pago editado
        setEditingPayment(prev => ({
          ...prev,
          attachments: [downloadURL],
          receiptUrls: [downloadURL],
          receiptUrl: downloadURL,
          updatedAt: new Date()
        }));

        showNotification(
          selectedFiles.length > 1 
            ? `${selectedFiles.length} archivos combinados y subidos como PDF Ãºnico`
            : 'Comprobante subido exitosamente', 
          'success'
        );

        // Limpiar archivos seleccionados
        setSelectedFiles([]);
      }

      return [downloadURL];
    } catch (error) {
      console.error('Error al procesar y subir archivos:', error);
      showNotification(`Error al procesar y subir los archivos: ${error.message}`, 'error');
      return [];
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Override close to notify parent
  const handleCloseDialog = () => {
    handleCloseEditPayment();
    onClose();
  };


  return (
    <>
      {/* Modal de ediciÃ³n de pago - COMPLETO ESTILO NEWPAYMENTPAGE */}
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : '#ffffff',
            minHeight: '70vh',
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          pt: 3,
          px: 3,
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : '#ffffff',
          borderBottom: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{
              width: 52,
              height: 52,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <EditIcon sx={{ 
                fontSize: 24, 
                color: theme.palette.primary.main 
              }} />
            </Avatar>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: alpha(theme.palette.primary.main, 0.9),
              fontSize: '1.25rem'
            }}>
              Editar Pago
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 2.5, 
          pb: 0, 
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(circle, ${primaryColor}08 0%, transparent 70%)`
              : `radial-gradient(circle, ${primaryColor}05 0%, transparent 70%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }
        }}>
          <Grid container spacing={2}>
            {/* Columna Izquierda - InformaciÃ³n del Pago */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2.5
                }}>
                  <Avatar sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                  }}>
                    <MoneyIcon sx={{ 
                      fontSize: 20, 
                      color: theme.palette.primary.main 
                    }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: alpha(theme.palette.primary.main, 0.9),
                    fontSize: '1.1rem'
                  }}>
                    Datos del Pago
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                {/* Empresa/Cliente (a quiÃ©n le corresponde el pago) */}
                <TextField
                  name="companyName"
                  label="Empresa / Cliente"
                  fullWidth
                  required
                  value={editFormData.companyName}
                  onChange={handleFormChange}
                  variant="outlined"
                  helperText="Empresa a la que le corresponde este pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Proveedor/Beneficiario (desde el compromiso - solo lectura) */}
                <TextField
                  name="provider"
                  label="Proveedor / Beneficiario"
                  fullWidth
                  value={editFormData.provider}
                  variant="outlined"
                  disabled
                  helperText="Tomado del compromiso original (no editable)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                />

                {/* Concepto */}
                <TextField
                  name="concept"
                  label="Concepto del Pago"
                  fullWidth
                  required
                  value={editFormData.concept}
                  onChange={handleFormChange}
                  variant="outlined"
                  helperText="Describe el motivo del pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />
                
                {/* Montos - Layout dinÃ¡mico segÃºn tipo de compromiso */}
                {isColjuegosCommitment(commitmentData) ? (
                  // Layout para Coljuegos (6 campos completos)
                  <>
                    <TextField
                      name="originalAmount"
                      label="Monto Original"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.originalAmount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.text.secondary, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto total original (base + impuestos)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: theme.palette.background.paper,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          },
                          '&.Mui-focused': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 0 0 2px ${primaryColor}20`,
                          }
                        }
                      }}
                    />

                    {/* NUEVO CAMPO: Solo Valor Base Original para Coljuegos */}
                    <TextField
                      label="Valor Base Original"
                      type="text"
                      fullWidth
                      value={commitmentData?.baseAmount !== undefined ? fCurrency(commitmentData.baseAmount) : ''}
                      variant="outlined"
                      disabled
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.primary.main, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Valor base sin impuestos - Coljuegos"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          '& input': {
                            color: theme.palette.primary.main,
                            fontWeight: 600
                          }
                        }
                      }}
                    />

                    {/* Montos Base de Coljuegos */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        name="derechosExplotacion"
                        label="Derechos de ExplotaciÃ³n (Base)"
                        type="text"
                        fullWidth
                        value={editFormData.derechosExplotacion || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.info.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Monto base derechos de explotaciÃ³n"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />

                      <TextField
                        name="gastosAdministracion"
                        label="Gastos de AdministraciÃ³n (Base)"
                        type="text"
                        fullWidth
                        value={editFormData.gastosAdministracion || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.info.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Monto base gastos administrativos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />
                    </Stack>

                    {/* Intereses EspecÃ­ficos de Coljuegos */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        name="interesesDerechosExplotacion"
                        label="Intereses Derechos de ExplotaciÃ³n"
                        type="text"
                        fullWidth
                        value={editFormData.interesesDerechosExplotacion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.warning.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Intereses por derechos de explotaciÃ³n"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />

                      <TextField
                        name="interesesGastosAdministracion"
                        label="Intereses Gastos de AdministraciÃ³n"
                        type="text"
                        fullWidth
                        value={editFormData.interesesGastosAdministracion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.warning.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Intereses por gastos administrativos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />
                    </Stack>

                    <TextField
                      name="amount"
                      label="Monto Total Pagado"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.amount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          px: 0.5,
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.success.main, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto final que se pagÃ³ efectivamente"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.success.main}`
                        }
                      }}
                    />
                  </>
                ) : (
                  // Layout para compromisos normales (3 campos)
                  <>
                    <TextField
                      name="originalAmount"
                      label="Monto Original"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.originalAmount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto total original (base + impuestos)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper
                        }
                      }}
                    />

                    <TextField
                      name="interests"
                      label="Intereses"
                      type="text"
                      fullWidth
                      value={editFormData.interests}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: 'warning.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Intereses aplicados"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper
                        }
                      }}
                    />

                    {/* CAMPOS PARA COMPROMISOS REGULARES */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Valor Base Original"
                        type="text"
                        fullWidth
                        value={commitmentData?.baseAmount !== undefined ? fCurrency(commitmentData.baseAmount) : ''}
                        variant="outlined"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.primary.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Valor base sin impuestos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            '& input': {
                              color: theme.palette.primary.main,
                              fontWeight: 600
                            }
                          }
                        }}
                      />

                      {/* IVA Original - Solo mostrar si existe, como en el modal de vista */}
                      {commitmentData?.iva > 0 && (
                        <TextField
                          label="IVA Original"
                          type="text"
                          fullWidth
                          value={
                            commitmentData?.iva ? 
                              fCurrency(commitmentData.iva) : 
                              ''
                          }
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.warning.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="IVA del compromiso original"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.warning.main, 0.05),
                              '& input': {
                                color: theme.palette.warning.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />
                      )}
                    </Stack>

                    {/* RETENCIONES (Solo si hasImpuestos = true) */}
                    {commitmentData?.hasImpuestos && (
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="Retefuente Original"
                          type="text"
                          fullWidth
                          value={commitmentData?.retefuente ? formatCurrency(commitmentData.retefuente) : ''}
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.error.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="Retefuente del compromiso"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.error.main, 0.05),
                              '& input': {
                                color: theme.palette.error.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />

                        <TextField
                          label="Reteica Original"
                          type="text"
                          fullWidth
                          value={commitmentData?.reteica ? formatCurrency(commitmentData.reteica) : ''}
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.info.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="Reteica del compromiso"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.info.main, 0.05),
                              '& input': {
                                color: theme.palette.info.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />
                      </Stack>
                    )}
                    
                    <TextField
                      name="amount"
                      label="Monto Total Pagado"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.amount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          px: 0.5,
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: 'success.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto final pagado"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.success.main}`
                        }
                      }}
                    />
                  </>
                )}
                
                {/* MÃ©todo de Pago */}
                <FormControl fullWidth required>
                  <InputLabel>MÃ©todo de Pago</InputLabel>
                  <Select
                    name="method"
                    value={editFormData.method || ''}
                    onChange={handleFormChange}
                    label="MÃ©todo de Pago"
                    sx={{
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }}
                  >
                    <MenuItem value="Efectivo">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <MoneyIcon fontSize="small" />
                        Efectivo
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Transferencia">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <CompanyIcon fontSize="small" />
                        Transferencia Bancaria
                      </Stack>
                    </MenuItem>
                    <MenuItem value="PSE">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <ReceiptIcon fontSize="small" />
                        PSE (Pagos Seguros en LÃ­nea)
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Cuenta Bancaria de Origen */}
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel 
                    id="source-account-label" 
                    shrink
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      px: 0.5,
                      borderRadius: 0.5,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    Cuenta Bancaria de Origen
                  </InputLabel>
                  <Select
                    labelId="source-account-label"
                    name="sourceAccount"
                    value={editFormData.sourceAccount || ''}
                    onChange={handleSourceAccountSelect}
                    label="Cuenta Bancaria de Origen"
                    displayEmpty
                    notched
                    sx={{
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Seleccionar cuenta bancaria</em>
                    </MenuItem>
                    {getBankAccounts().map((account, index) => {
                      return (
                        <MenuItem key={index} value={account.account}>
                          <Stack direction="column" alignItems="flex-start" width="100%">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {account.account}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {account.bank} - {account.companyName} {account.type && `(${account.type})`}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText>Selecciona de quÃ© cuenta saliÃ³ el dinero</FormHelperText>
                </FormControl>

                {/* Campo banco de origen (auto-completado) */}
                {editFormData.sourceBank && (
                  <TextField
                    name="sourceBank"
                    label="Banco de Origen"
                    fullWidth
                    value={editFormData.sourceBank}
                    variant="outlined"
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  />
                )}

                {/* Fecha de Pago */}
                <TextField
                  name="date"
                  label="Fecha de Pago"
                  type="date"
                  required
                  fullWidth
                  value={editFormData.date}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true
                  }}
                  helperText="Fecha en que se realizÃ³ el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Referencia/NÃºmero */}
                <TextField
                  name="reference"
                  label="Referencia/NÃºmero (Opcional)"
                  fullWidth
                  value={editFormData.reference || ''}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Ej: Transferencia #123456, Cheque #001"
                  helperText="NÃºmero de referencia del pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Notas */}
                <TextField
                  name="notes"
                  label="Notas Adicionales (Opcional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={editFormData.notes}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Agregar observaciones, condiciones especiales, o informaciÃ³n relevante sobre este pago..."
                  helperText="InformaciÃ³n adicional sobre el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />
              </Stack>
              </Box>
            </Grid>

            {/* Columna Derecha - Comprobantes */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: alpha(theme.palette.success.main, 0.02),
                border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2.5
                }}>
                  <Avatar sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                  }}>
                    <UploadIcon sx={{ 
                      fontSize: 20, 
                      color: theme.palette.success.main 
                    }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: alpha(theme.palette.success.main, 0.9),
                    fontSize: '1.1rem'
                  }}>
                    Comprobantes de Pago
                  </Typography>
                </Box>

                {/* Ãrea de carga de comprobantes */}
                <Paper
                  elevation={0}
                  sx={{
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.6)}`,
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    background: alpha(theme.palette.primary.main, 0.02),
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.8),
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)'
                    }
                  }}
                  onClick={() => document.getElementById('receipt-upload-edit').click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <motion.div
                  animate={dragActive ? { scale: 1.08, rotate: [0, 3, -3, 0] } : { scale: 1 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Avatar sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: dragActive 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : alpha(theme.palette.primary.main, 0.1),
                    border: `2px solid ${dragActive 
                      ? alpha(theme.palette.success.main, 0.4) 
                      : alpha(theme.palette.primary.main, 0.3)}`,
                    mb: 2,
                    transition: 'all 0.3s ease'
                  }}>
                    <UploadIcon sx={{ 
                      fontSize: 28, 
                      color: dragActive 
                        ? theme.palette.success.main 
                        : theme.palette.primary.main,
                      transition: 'all 0.3s ease'
                    }} />
                  </Avatar>
                </motion.div>
                
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: dragActive 
                    ? theme.palette.success.main 
                    : alpha(theme.palette.primary.main, 0.9),
                  mb: 1,
                  transition: 'all 0.3s ease'
                }}>
                  {dragActive ? 'Â¡Suelta los archivos aquÃ­!' : 'Subir Comprobantes'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                  Arrastra archivos aquÃ­ o haz clic para seleccionar
                </Typography>
                
                <Typography variant="caption" sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontSize: '0.75rem'
                }}>
                  PDF, JPG, PNG â€¢ MÃ¡ximo 10MB por archivo
                </Typography>
                
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, mt: 1 }}>
                  ðŸ’¡ MÃºltiples archivos se combinarÃ¡n automÃ¡ticamente en un solo PDF
                </Typography>

                <input
                  id="receipt-upload-edit"
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileSelect}
                />
              </Paper>

              {/* Lista de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2
                  }}>
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                    }}>
                      <FileIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.info.main 
                      }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: alpha(theme.palette.info.main, 0.9)
                    }}>
                      ðŸ“‹ Archivos Seleccionados ({selectedFiles.length})
                    </Typography>
                  </Box>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {selectedFiles.map((fileData, index) => (
                      <motion.div
                        key={fileData.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            background: fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.02)
                              : alpha(theme.palette.info.main, 0.02),
                            border: `1px solid ${fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.6)
                              : alpha(theme.palette.info.main, 0.6)}`,
                            borderRadius: 2,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                              borderColor: fileData.uploaded 
                                ? alpha(theme.palette.success.main, 0.8)
                                : alpha(theme.palette.info.main, 0.8)
                            }
                          }}
                        >
                          <Avatar sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.info.main, 0.3)}`
                          }}>
                            <FileIcon sx={{ 
                              fontSize: 18, 
                              color: fileData.uploaded 
                                ? theme.palette.success.main
                                : theme.palette.info.main
                            }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              mb: 0.5,
                              color: fileData.uploaded 
                                ? theme.palette.success.main
                                : theme.palette.info.main
                            }}>
                              {fileData.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(fileData.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <IconButton 
                            onClick={() => removeFile(fileData.id)}
                            size="small"
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      </motion.div>
                    ))}
                  </Stack>
                  
                  {/* InformaciÃ³n sobre mÃºltiples archivos */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{ 
                        mt: 3, 
                        p: 3, 
                        background: alpha(theme.palette.info.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                          }}>
                            <InfoIcon sx={{ 
                              fontSize: 18, 
                              color: theme.palette.info.main 
                            }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ 
                              fontWeight: 600, 
                              mb: 0.5,
                              color: alpha(theme.palette.info.main, 0.9)
                            }}>
                              ï¿½ Procesamiento AutomÃ¡tico
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                              {selectedFiles.length > 1 
                                ? `${selectedFiles.length} archivos se combinarÃ¡n automÃ¡ticamente en un PDF Ãºnico al guardar cambios`
                                : '1 archivo se subirÃ¡ al guardar cambios'
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setSelectedFiles([])}
                          sx={{ 
                            color: theme.palette.info.main, 
                            borderColor: alpha(theme.palette.info.main, 0.6),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              borderColor: theme.palette.info.main,
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Limpiar
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                </Box>
              )}

              {/* Mostrar comprobantes actuales si existen */}
              {editingPayment?.attachments?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2
                  }}>
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                    }}>
                      <ReceiptIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.success.main 
                      }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: alpha(theme.palette.success.main, 0.9)
                    }}>
                      ðŸ“‹ Comprobantes Actuales:
                    </Typography>
                  </Box>
                  {editingPayment.attachments.map((attachment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          background: alpha(theme.palette.success.main, 0.02),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                          borderRadius: 2,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                            borderColor: alpha(theme.palette.success.main, 0.8),
                            background: alpha(theme.palette.success.main, 0.04)
                          }
                        }}
                      >
                        <Avatar sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                        }}>
                          <FileIcon sx={{ 
                            fontSize: 22, 
                            color: theme.palette.success.main 
                          }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            color: alpha(theme.palette.success.main, 0.9),
                            mb: 0.5
                          }}>
                            Comprobante {index + 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            opacity: 0.7
                          }}>
                            {attachment.slice(-20)}
                          </Typography>
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Chip
                            label="PDF"
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Progress bar durante la subida */}
        {uploadingFile && uploadProgress > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1, borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              {uploadProgress < 25 ? 'Preparando archivos...' :
               uploadProgress < 50 ? 'Combinando documentos...' :
               uploadProgress < 75 ? 'Subiendo a la nube...' :
               uploadProgress < 90 ? 'Actualizando datos...' :
               'Finalizando...'}
            </Typography>
          </Box>
        )}

        <DialogActions sx={{ 
          p: 2, 
          pt: 1.5, 
          gap: 1.5,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)'
            : 'linear-gradient(145deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%)',
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* BotÃ³n de eliminar pago - Lado izquierdo */}
          <Button
            onClick={() => handleOpenDeletePayment(editingPayment)}
            variant="outlined"
            color="error"
            size="medium"
            startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
            sx={{ 
              borderRadius: 1.5,
              px: 2.5,
              py: 1,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            Eliminar Pago
          </Button>

          {/* Botones de cancelar y guardar - Lado derecho */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              size="medium"
              startIcon={<CancelIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePayment}
              variant="contained"
              size="medium"
              startIcon={uploadingFile ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: 18 }} />}
              disabled={!editFormData.concept || !editFormData.amount || !editFormData.method || !editFormData.companyName || uploadingFile}
              sx={{ 
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: `linear-gradient(135deg, ${primaryColor}DD 0%, ${secondaryColor}DD 100%)`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 20px ${primaryColor}30`
                },
                '&:disabled': {
                  background: theme.palette.action.disabled,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              {uploadingFile ? 
                (uploadProgress > 0 ? 
                  `${uploadProgress < 50 ? 'Subiendo...' : uploadProgress < 90 ? 'Guardando...' : 'Finalizando...'}` 
                  : 'Procesando...'
                ) 
                : 'Guardar Cambios'
              }
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* DiÃ¡logo de confirmaciÃ³n de eliminaciÃ³n de pago */}
      <Dialog
        open={deletePaymentDialogOpen}
        onClose={handleCloseDeletePayment}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main',
          fontWeight: 600
        }}>
          <DeleteIcon />
          Eliminar Pago
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Â¿EstÃ¡s seguro de que deseas eliminar este pago? Esta acciÃ³n no se puede deshacer.
          </Typography>
          
          {paymentToDelete && (
            <Paper sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Detalles del pago:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Concepto:</strong> {paymentToDelete.concept || 'Sin concepto'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Monto:</strong> ${paymentToDelete.amount?.toLocaleString('es-MX')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Empresa:</strong> {paymentToDelete.companyName || 'Sin empresa'}
              </Typography>
              {paymentToDelete.attachments?.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Comprobantes:</strong> {paymentToDelete.attachments.length} archivo(s)
                </Typography>
              )}
            </Paper>
          )}
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Se eliminarÃ¡ el registro del pago y todos sus comprobantes asociados.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleCloseDeletePayment}
            variant="outlined"
            disabled={deletingPayment}
            sx={{ 
              borderRadius: 1,
              px: 3,
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeletePayment}
            variant="contained"
            color="error"
            disabled={deletingPayment}
            startIcon={deletingPayment ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ 
              borderRadius: 1,
              px: 3,
              fontWeight: 600
            }}
          >
            {deletingPayment ? 'Eliminando...' : 'Eliminar Pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditPaymentDialog;
