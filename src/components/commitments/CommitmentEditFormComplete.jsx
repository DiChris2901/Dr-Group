// ✅ Modal de Edición de Compromisos - DESIGN SYSTEM EMPRESARIAL DR GROUP
// Siguiendo Modal Design System docs/MODAL_DESIGN_SYSTEM.md

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  alpha,
  useTheme,
  Autocomplete
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Close,
  AttachMoney,
  Business,
  Person,
  DateRange,
  Payment,
  Repeat,
  Description,
  VerifiedUser,
  Receipt,
  Calculate,
  AttachFile as AttachFileIcon,
  Edit as EditIcon,
  CloudUpload,
  Delete,
  PictureAsPdf,
  Image,
  InsertDriveFile
} from '@mui/icons-material';
import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import useActivityLogs from '../../hooks/useActivityLogs';
import { generateRecurringCommitments, saveRecurringCommitments } from '../../utils/recurringCommitments';

// Opciones de método de pago - COINCIDEN CON FIREBASE
const PAYMENT_METHOD_OPTIONS = [
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'PSE', label: 'PSE' },
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Giro', label: 'Giro' },
  { value: 'Otro', label: 'Otro' }
];

// 📅 Funciones de manejo de fechas
const formatSafeDate = (dateValue, formatString = 'yyyy-MM-dd') => {
  try {
    if (!dateValue) return '';
    
    let dateToFormat;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      dateToFormat = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
      dateToFormat = new Date(dateValue);
    } else {
      return '';
    }
    
    if (isNaN(dateToFormat)) return '';
    
    if (formatString === 'yyyy-MM-dd') {
      return dateToFormat.toISOString().split('T')[0];
    } else if (formatString === 'dd/MM/yyyy') {
      return dateToFormat.toLocaleDateString('es-CO');
    }
    
    return dateToFormat.toLocaleDateString('es-CO');
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

const CommitmentEditFormComplete = ({ open, onClose, commitment, onUpdate }) => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();

  // Estados principales
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // Estados para manejo de archivos
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Estado del formulario - TODOS LOS CAMPOS
  const [formData, setFormData] = useState({
    concept: '',
    companyId: '',
    beneficiary: '',
    beneficiaryNit: '',
    baseAmount: '',
    derechosExplotacion: '',
    gastosAdministracion: '',
    iva: '',
    retefuente: '',
    ica: '',
    discount: '',
    invoiceNumber: '',
    hasTaxes: false,
    totalAmount: '',
    paymentMethod: 'Transferencia',
    observations: '',
    deferredPayment: false,
    status: 'pending',
    dueDate: null,
    periodicity: 'monthly',
    recurringCount: 12,
    invoiceFiles: [],
    invoiceURLs: [],
    invoiceFileNames: [],
    receiptMetadata: {},
    amount: ''
  });

  // 💰 Funciones para formateo de moneda colombiana
  const formatNumberWithCommas = (value) => {
    if (!value && value !== 0) return '';
    
    const strValue = value.toString();
    const cleanValue = strValue.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (!cleanValue) return '';
    
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return formattedInteger + ',' + decimalPart.substring(0, 2);
    } else {
      return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  const parseFormattedNumber = (value) => {
    if (!value && value !== 0) return '';
    return value.toString()
      .replace(/\./g, '')
      .replace(/,/g, '.');
  };

  // 🎮 Detectar compromisos de Coljuegos
  const isColjuegosCommitment = () => {
    return formData.beneficiary && formData.beneficiary.toLowerCase().includes('coljuegos');
  };

  // 🧮 Calcular automáticamente el total
  const calculateTotal = () => {
    if (isColjuegosCommitment()) {
      const derechos = parseFloat(formData.derechosExplotacion) || 0;
      const gastos = parseFloat(formData.gastosAdministracion) || 0;
      return derechos + gastos;
    }
    
    const base = parseFloat(formData.baseAmount) || 0;
    if (!formData.hasTaxes) return base;
    
    const iva = parseFloat(formData.iva) || 0;
    const retefuente = parseFloat(formData.retefuente) || 0;
    const ica = parseFloat(formData.ica) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    return base + iva - retefuente - ica - discount;
  };

  // Calcular progreso del formulario
  const calculateProgress = () => {
    const requiredFields = ['concept', 'companyId', 'totalAmount', 'dueDate'];
    const filledFields = requiredFields.filter(field => {
      if (field === 'dueDate') return formData[field] !== null;
      return formData[field] && formData[field].toString().trim() !== '';
    });
    return (filledFields.length / requiredFields.length) * 100;
  };

  // 🧮 Actualizar total automáticamente
  useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toString(),
      amount: total.toString()
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
      console.log('🔍 Debugging commitment data:', commitment);
      console.log('🔍 invoiceFiles (legacy):', commitment.invoiceFiles);
      console.log('🔍 invoiceURLs (legacy):', commitment.invoiceURLs);
      console.log('🔍 invoices (current):', commitment.invoices);
      console.log('🔍 receiptMetadata:', commitment.receiptMetadata);
      
      // ✅ ACTUALIZADO: Leer archivos del campo invoices array
      let invoiceFiles = [];
      let invoiceURLs = [];
      let invoiceFileNames = [];
      
      // Prioridad: usar invoices array si existe, sino legacy fields
      if (commitment.invoices && Array.isArray(commitment.invoices) && commitment.invoices.length > 0) {
        console.log('📁 Usando invoices array (formato actual)');
        commitment.invoices.forEach((invoice, index) => {
          if (invoice.url || invoice.downloadURL) {
            invoiceURLs.push(invoice.url || invoice.downloadURL);
            invoiceFileNames.push(invoice.name || `Factura ${index + 1}`);
            invoiceFiles.push({
              name: invoice.name || `Factura ${index + 1}`,
              url: invoice.url || invoice.downloadURL,
              type: invoice.type || 'application/pdf'
            });
          }
        });
      } else if (commitment.invoiceFiles || commitment.invoiceURLs) {
        console.log('📁 Usando campos legacy (invoiceFiles/invoiceURLs)');
        invoiceFiles = commitment.invoiceFiles || [];
        invoiceURLs = commitment.invoiceURLs || [];
        invoiceFileNames = commitment.invoiceFileNames || [];
      }
      
      console.log('✅ Archivos procesados:', { invoiceFiles, invoiceURLs, invoiceFileNames });
      
      const initialData = {
        concept: commitment.concept || commitment.description || '',
        companyId: commitment.companyId || '',
        beneficiary: commitment.beneficiary || '',
        beneficiaryNit: commitment.beneficiaryNit || '',
        baseAmount: commitment.baseAmount || commitment.amount || '',
        derechosExplotacion: commitment.derechosExplotacion || '',
        gastosAdministracion: commitment.gastosAdministracion || '',
        iva: commitment.iva || '',
        retefuente: commitment.retefuente || '',
        ica: commitment.ica || '',
        discount: commitment.discount || '',
        invoiceNumber: commitment.invoiceNumber || '',
        hasTaxes: commitment.hasTaxes || false,
        totalAmount: commitment.totalAmount || commitment.amount || '',
        paymentMethod: commitment.paymentMethod || 'Transferencia',
        observations: commitment.observations || '',
        deferredPayment: commitment.deferredPayment || false,
        status: commitment.status || 'pending',
        dueDate: formatSafeDate(commitment.dueDate, 'yyyy-MM-dd'),
        periodicity: commitment.periodicity || 'monthly',
        recurringCount: commitment.recurringCount || 12,
        invoiceFiles: invoiceFiles,
        invoiceURLs: invoiceURLs,
        invoiceFileNames: invoiceFileNames,
        receiptMetadata: commitment.receiptMetadata || {},
        amount: commitment.totalAmount || commitment.amount || ''
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [commitment, open]);

  // Detectar cambios
  useEffect(() => {
    const hasFormChanges = Object.keys(formData).some(key => {
      return formData[key] !== originalData[key];
    });
    setHasChanges(hasFormChanges);
  }, [formData, originalData]);

  // Manejar cambios de campo
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones de manejo de campos numéricos
  const handleNumericChange = (field) => (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange(field, cleanValue);
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!commitment || !formData.concept.trim() || !formData.totalAmount) {
      return;
    }

    setSaving(true);
    try {
      let dueDateToSave = null;
      if (formData.dueDate) {
        if (typeof formData.dueDate === 'string') {
          const [year, month, day] = formData.dueDate.split('-');
          dueDateToSave = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        } else {
          dueDateToSave = formData.dueDate;
        }
      }
      
      const updatedData = {
        concept: formData.concept.trim(),
        companyId: formData.companyId,
        beneficiary: formData.beneficiary.trim(),
        beneficiaryNit: formData.beneficiaryNit.trim(),
        baseAmount: parseFloat(formData.baseAmount) || 0,
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
        dueDate: dueDateToSave,
        periodicity: formData.periodicity,
        recurringCount: formData.recurringCount,
        amount: parseFloat(formData.totalAmount) || 0,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      const commitmentRef = doc(db, 'commitments', commitment.id);
      await updateDoc(commitmentRef, updatedData);

      // 🔄 Si cambió de "unique" a recurrente, generar compromisos adicionales
      const wasUnique = commitment.periodicity === 'unique';
      const isNowRecurring = formData.periodicity !== 'unique';
      
      if (wasUnique && isNowRecurring) {
        console.log('🔄 Detectado cambio de único a recurrente, generando compromisos...');
        
        // Usar los datos actualizados para generar compromisos recurrentes
        const baseCommitmentData = {
          ...updatedData,
          id: commitment.id, // Mantener el ID original para evitar duplicar
          createdAt: commitment.createdAt,
          createdBy: commitment.createdBy,
          // Usar la fecha de vencimiento actual como base
          dueDate: dueDateToSave || commitment.dueDate
        };
        
        try {
          // 🔄 Generar compromisos recurrentes (saltando el primero para evitar duplicados)
          const recurringCommitments = await generateRecurringCommitments(baseCommitmentData, 12, true);
          console.log('✅ Compromisos recurrentes generados:', recurringCommitments);
          
          // 💾 Guardar los compromisos generados en Firebase
          if (recurringCommitments && recurringCommitments.length > 0) {
            const savedIds = await saveRecurringCommitments(recurringCommitments);
            console.log('✅ Compromisos guardados en Firebase:', savedIds);
            
            addNotification({
              type: 'success',
              title: '🔄 Compromisos Recurrentes Creados',
              message: `Se generaron y guardaron ${recurringCommitments.length} compromisos adicionales`,
              duration: 4000
            });
          } else {
            console.log('ℹ️ No se generaron compromisos (posiblemente limitados por fecha)');
            addNotification({
              type: 'info',
              title: 'ℹ️ Sin Compromisos Adicionales',
              message: 'No se generaron compromisos adicionales (limitados por fecha del año actual)',
              duration: 4000
            });
          }
        } catch (recurringError) {
          console.error('❌ Error generando compromisos recurrentes:', recurringError);
          addNotification({
            type: 'warning',
            title: '⚠️ Advertencia',
            message: 'El compromiso se actualizó pero hubo un problema generando los compromisos recurrentes',
            duration: 5000
          });
        }
      }

      // 🗑️ Si cambió de recurrente a "unique", eliminar compromisos relacionados
      const wasRecurring = commitment.periodicity !== 'unique';
      const isNowUnique = formData.periodicity === 'unique';
      
      if (wasRecurring && isNowUnique) {
        console.log('🗑️ Detectado cambio de recurrente a único, eliminando compromisos relacionados...');
        
        try {
          // Buscar compromisos relacionados con el mismo concepto, empresa y beneficiario
          // pero que NO sea el compromiso actual que estamos editando
          const relatedQuery = query(
            collection(db, 'commitments'),
            where('concept', '==', formData.concept.trim()),
            where('companyId', '==', formData.companyId),
            where('beneficiary', '==', formData.beneficiary.trim())
          );
          
          const relatedSnapshot = await getDocs(relatedQuery);
          const relatedCommitments = relatedSnapshot.docs.filter(doc => doc.id !== commitment.id);
          
          if (relatedCommitments.length > 0) {
            // Eliminar en lote todos los compromisos relacionados
            const batch = writeBatch(db);
            relatedCommitments.forEach((doc) => {
              batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`✅ Eliminados ${relatedCommitments.length} compromisos relacionados`);
            
            addNotification({
              type: 'success',
              title: '🗑️ Compromisos Relacionados Eliminados',
              message: `Se eliminaron ${relatedCommitments.length} compromisos del grupo recurrente`,
              duration: 4000
            });
          } else {
            console.log('ℹ️ No se encontraron compromisos relacionados para eliminar');
          }
          
        } catch (deleteError) {
          console.error('❌ Error eliminando compromisos relacionados:', deleteError);
          addNotification({
            type: 'warning',
            title: '⚠️ Advertencia',
            message: 'El compromiso se actualizó pero hubo un problema eliminando los compromisos relacionados',
            duration: 5000
          });
        }
      }

      // 📝 Registrar actividad de auditoría
      await logActivity('update_commitment', 'commitment', commitment.id, {
        concept: formData.concept.trim(),
        companyName: companies.find(c => c.id === formData.companyId)?.name || 'N/A',
        totalAmount: parseFloat(formData.totalAmount) || 0,
        beneficiary: formData.beneficiary.trim(),
        previousAmount: commitment.totalAmount || commitment.amount || 0
      });

      addNotification({
        type: 'success',
        title: '✅ Compromiso Actualizado',
        message: `Se actualizó correctamente: ${formData.concept}`,
        duration: 4000
      });

      if (onUpdate) onUpdate();
      onClose();
      
    } catch (error) {
      console.error('Error al actualizar compromiso:', error);
      addNotification({
        type: 'error',
        title: '❌ Error al Actualizar',
        message: 'No se pudo actualizar el compromiso. Intenta de nuevo.',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  // 📎 Funciones para manejo de archivos
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      addNotification({
        type: 'error',
        title: '❌ Archivo No Válido',
        message: 'Solo se permiten archivos PDF, JPG, PNG o WebP',
        duration: 4000
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: '❌ Archivo Muy Grande',
        message: 'El archivo debe ser menor a 5MB',
        duration: 4000
      });
      return;
    }

    setFileToUpload(file);
    
    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !commitment) return;

    setUploadingFile(true);
    try {
      // 1. Eliminar archivo anterior si existe
      if (formData.invoiceFiles && formData.invoiceFiles.length > 0) {
        for (const oldFileUrl of formData.invoiceFiles) {
          try {
            const oldFileRef = ref(storage, oldFileUrl);
            await deleteObject(oldFileRef);
          } catch (error) {
            console.warn('Error al eliminar archivo anterior:', error);
          }
        }
      }

      // 2. Subir nuevo archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${fileToUpload.name}`;
      const fileRef = ref(storage, `commitments/${commitment.id}/invoices/${fileName}`);
      
      await uploadBytes(fileRef, fileToUpload);
      const downloadURL = await getDownloadURL(fileRef);

      // 3. Actualizar el estado del formulario
      const newInvoiceFiles = [downloadURL];
      const newInvoiceFileNames = [fileToUpload.name];

      setFormData(prev => ({
        ...prev,
        invoiceFiles: newInvoiceFiles,
        invoiceURLs: newInvoiceFiles,
        invoiceFileNames: newInvoiceFileNames
      }));

      // 4. Actualizar en Firebase
      const commitmentRef = doc(db, 'commitments', commitment.id);
      await updateDoc(commitmentRef, {
        invoiceFiles: newInvoiceFiles,
        invoiceURLs: newInvoiceFiles,
        invoiceFileNames: newInvoiceFileNames,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });

      // 📝 Registrar actividad de auditoría - Subida de comprobante de compromiso
      await logActivity('update_commitment_invoice', 'commitment', commitment.id, {
        concept: commitment.concept || 'Sin concepto',
        companyName: companies.find(c => c.id === commitment.companyId)?.name || 'Sin empresa',
        totalAmount: commitment.totalAmount || commitment.amount || 0,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        action: 'upload_invoice'
      });

      addNotification({
        type: 'success',
        title: '✅ Comprobante Actualizado',
        message: 'El comprobante se subió correctamente',
        duration: 4000
      });

      // Limpiar estados
      setFileToUpload(null);
      setFilePreview(null);
      
      // Limpiar input file
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error al subir archivo:', error);
      addNotification({
        type: 'error',
        title: '❌ Error al Subir',
        message: 'No se pudo subir el comprobante. Intenta de nuevo.',
        duration: 5000
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = async () => {
    if (!commitment || !hasAttachedFiles()) return;

    setUploadingFile(true);
    try {
      // Eliminar archivos de Storage
      if (formData.invoiceFiles && formData.invoiceFiles.length > 0) {
        for (const fileUrl of formData.invoiceFiles) {
          try {
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);
          } catch (error) {
            console.warn('Error al eliminar archivo:', error);
          }
        }
      }

      // Eliminar archivos de receiptMetadata
      if (commitment.receiptMetadata) {
        for (const fileId of Object.keys(commitment.receiptMetadata)) {
          try {
            const metadata = commitment.receiptMetadata[fileId];
            if (metadata.url) {
              const fileRef = ref(storage, metadata.url);
              await deleteObject(fileRef);
            }
          } catch (error) {
            console.warn('Error al eliminar archivo de receiptMetadata:', error);
          }
        }
      }

      // Actualizar estado del formulario
      setFormData(prev => ({
        ...prev,
        invoiceFiles: [],
        invoiceURLs: [],
        invoiceFileNames: [],
        receiptMetadata: {}
      }));

      // Actualizar en Firebase
      const commitmentRef = doc(db, 'commitments', commitment.id);
      await updateDoc(commitmentRef, {
        invoiceFiles: [],
        invoiceURLs: [],
        invoiceFileNames: [],
        receiptMetadata: {},
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });

      // 📝 Registrar actividad de auditoría - Eliminación de comprobante de compromiso
      await logActivity('delete_commitment_invoice', 'commitment', commitment.id, {
        concept: commitment.concept || 'Sin concepto',
        companyName: companies.find(c => c.id === commitment.companyId)?.name || 'Sin empresa',
        totalAmount: commitment.totalAmount || commitment.amount || 0,
        deletedFileName: commitment.invoiceFileNames?.[0] || 'archivo_desconocido',
        action: 'delete_invoice'
      });

      addNotification({
        type: 'success',
        title: '✅ Comprobante Eliminado',
        message: 'El comprobante se eliminó correctamente',
        duration: 4000
      });

    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      addNotification({
        type: 'error',
        title: '❌ Error al Eliminar',
        message: 'No se pudo eliminar el comprobante. Intenta de nuevo.',
        duration: 5000
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFile />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return <PictureAsPdf />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return <Image />;
    return <InsertDriveFile />;
  };

  // 🔍 Función para detectar si hay archivos adjuntos
  const hasAttachedFiles = () => {
    return (
      (formData.invoiceFiles && formData.invoiceFiles.length > 0) ||
      (formData.invoiceURLs && formData.invoiceURLs.length > 0) ||
      (formData.receiptMetadata && Object.keys(formData.receiptMetadata).length > 0) ||
      (commitment?.receiptMetadata && Object.keys(commitment.receiptMetadata).length > 0)
    );
  };

  // 🔍 Función para obtener el nombre del archivo
  const getFileName = () => {
    if (formData.invoiceFileNames && formData.invoiceFileNames.length > 0) {
      return formData.invoiceFileNames[0];
    }
    if (commitment?.receiptMetadata) {
      const metadata = Object.values(commitment.receiptMetadata)[0];
      return metadata?.name || metadata?.originalName || 'Comprobante adjunto';
    }
    return 'Comprobante.pdf';
  };

  // Constantes de estilo según Design System
  const CARD_STYLES = {
    primary: {
      p: 3,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    secondary: {
      p: 3.5,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }
  };

  const OVERLINE_STYLES = {
    primary: {
      fontWeight: 600,
      color: 'primary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
    },
    secondary: {
      fontWeight: 600,
      color: 'secondary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
    }
  };

  const progress = calculateProgress();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"  // ✅ ACTUALIZADO: Aumentado de "md" a "lg" para más espacio en los campos
      PaperProps={{
        sx: {
          borderRadius: 2,  // EXACTO
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      {/* Header con estructura exacta del Design System */}
      <DialogTitle sx={{ 
        pb: 2,  // EXACTO
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>  {/* EXACTO gap: 1.5 */}
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <EditIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,  // EXACTO
              mb: 0,           // EXACTO
              color: 'text.primary' 
            }}>
              Editar Compromiso
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {commitment?.concept || 'Actualizando información'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={`${Math.round(progress)}% Completado`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      {/* Content con estructura exacta del Design System */}
      <DialogContent sx={{ 
        p: 3,     // EXACTO
        pt: 5     // EXACTO
      }}>
        <Box sx={{ mt: 3 }}>  {/* EXACTO */}
          <Grid container spacing={3}>  {/* SIEMPRE spacing={3} */}
            
            {/* INFORMACIÓN PRINCIPAL - Modal de edición = md={7} */}
            <Grid item xs={12} md={7}>
              <Paper sx={CARD_STYLES.primary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.primary}>
                  Información General
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>  {/* EXACTO mt: 1 */}
                  
                  {/* Concepto */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Concepto o Descripción"
                      value={formData.concept}
                      onChange={(e) => handleFormChange('concept', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description color="primary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                  {/* Empresa y Beneficiario */}
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      fullWidth
                      options={companies}
                      value={companies.find(company => company.id === formData.companyId) || null}
                      onChange={(event, newValue) => {
                        handleFormChange('companyId', newValue ? newValue.id : '');
                      }}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {option.logoURL && (
                              <img 
                                src={option.logoURL} 
                                alt={option.name}
                                style={{ width: 24, height: 24, borderRadius: 4 }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                NIT: {option.nit}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Empresa"
                          variant="outlined"
                          placeholder="Buscar empresa... (ej: King)"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business color="primary" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 1 }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Beneficiario"
                      value={formData.beneficiary}
                      onChange={(e) => handleFormChange('beneficiary', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="primary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                  {/* NIT y Número de Factura */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="NIT / Identificación"
                      value={formData.beneficiaryNit}
                      onChange={(e) => handleFormChange('beneficiaryNit', e.target.value)}
                      variant="outlined"
                      helperText="NIT o identificación del beneficiario"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VerifiedUser color="primary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Número de Factura"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                      variant="outlined"
                      helperText="Número de factura o documento"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Receipt color="primary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                  {/* Sección Coljuegos o Valores Generales */}
                  {isColjuegosCommitment() ? (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Derechos de Explotación"
                          value={formData.derechosExplotacion ? formatNumberWithCommas(formData.derechosExplotacion) : ''}
                          onChange={handleNumericChange('derechosExplotacion')}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney color="success" />
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Gastos de Administración"
                          value={formData.gastosAdministracion ? formatNumberWithCommas(formData.gastosAdministracion) : ''}
                          onChange={handleNumericChange('gastosAdministracion')}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney color="warning" />
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Valor Base"
                          value={formData.baseAmount ? formatNumberWithCommas(formData.baseAmount) : ''}
                          onChange={handleNumericChange('baseAmount')}
                          variant="outlined"
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney color="primary" />
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.hasTaxes}
                              onChange={(e) => handleFormChange('hasTaxes', e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Incluir Impuestos y Descuentos"
                          sx={{ 
                            mt: 2,
                            '& .MuiFormControlLabel-label': { fontWeight: 500 }
                          }}
                        />
                      </Grid>

                      <AnimatePresence>
                        {formData.hasTaxes && (
                          <>
                            <Grid item xs={12} md={3}>
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <TextField
                                  fullWidth
                                  label="IVA"
                                  value={formData.iva ? formatNumberWithCommas(formData.iva) : ''}
                                  onChange={handleNumericChange('iva')}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">+</InputAdornment>
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              </motion.div>
                            </Grid>

                            <Grid item xs={12} md={3}>
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.1 }}
                              >
                                <TextField
                                  fullWidth
                                  label="Retención"
                                  value={formData.retefuente ? formatNumberWithCommas(formData.retefuente) : ''}
                                  onChange={handleNumericChange('retefuente')}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">-</InputAdornment>
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              </motion.div>
                            </Grid>

                            <Grid item xs={12} md={3}>
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.2 }}
                              >
                                <TextField
                                  fullWidth
                                  label="ICA"
                                  value={formData.ica ? formatNumberWithCommas(formData.ica) : ''}
                                  onChange={handleNumericChange('ica')}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">-</InputAdornment>
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              </motion.div>
                            </Grid>

                            <Grid item xs={12} md={3}>
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.3 }}
                              >
                                <TextField
                                  fullWidth
                                  label="Descuento"
                                  value={formData.discount ? formatNumberWithCommas(formData.discount) : ''}
                                  onChange={handleNumericChange('discount')}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">-</InputAdornment>
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              </motion.div>
                            </Grid>
                          </>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* Fecha y Periodicidad */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Vencimiento"
                      type="date"
                      value={formData.dueDate || ''}
                      onChange={(e) => handleFormChange('dueDate', e.target.value)}
                      variant="outlined"
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateRange color="primary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Periodicidad</InputLabel>
                      <Select
                        value={formData.periodicity}
                        onChange={(e) => handleFormChange('periodicity', e.target.value)}
                        label="Periodicidad"
                        startAdornment={
                          <InputAdornment position="start">
                            <Repeat color="primary" />
                          </InputAdornment>
                        }
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="unique">Pago único</MenuItem>
                        <MenuItem value="monthly">Mensual</MenuItem>
                        <MenuItem value="bimonthly">Bimestral</MenuItem>
                        <MenuItem value="quarterly">Trimestral</MenuItem>
                        <MenuItem value="fourmonthly">Cuatrimestral</MenuItem>
                        <MenuItem value="biannual">Semestral</MenuItem>
                        <MenuItem value="annual">Anual</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Método de Pago y Observaciones */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Método de Pago</InputLabel>
                      <Select
                        value={formData.paymentMethod}
                        onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                        label="Método de Pago"
                        startAdornment={
                          <InputAdornment position="start">
                            <Payment color="primary" />
                          </InputAdornment>
                        }
                        sx={{ borderRadius: 1 }}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Observaciones"
                      value={formData.observations}
                      onChange={(e) => handleFormChange('observations', e.target.value)}
                      variant="outlined"
                      multiline
                      rows={2}
                      helperText="Notas adicionales sobre el compromiso"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </Grid>

                </Grid>
              </Paper>
            </Grid>

            {/* INFORMACIÓN LATERAL - Modal de edición = md={5} */}
            <Grid item xs={12} md={5}>
              <Paper sx={CARD_STYLES.secondary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.secondary}>
                  <Calculate sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Resumen Financiero
                </Typography>

                {/* Total Calculado */}
                <Box sx={{ mt: 2 }}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      background: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Calculate color="success" fontSize="large" />
                      <Box>
                        <Typography variant="h6" color="success.main" fontWeight={600}>
                          Total del Compromiso
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isColjuegosCommitment() ? 'Derechos + Gastos Administración' : 'Valor base + impuestos - descuentos'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h5" color="success.main" fontWeight={600} sx={{ mt: 1 }}>
                      ${formData.totalAmount ? formatNumberWithCommas(formData.totalAmount) : '0'}
                    </Typography>
                  </Paper>
                </Box>

              </Paper>

              {/* TARJETA DE COMPROBANTE */}
              <Paper sx={{ ...CARD_STYLES.secondary, mt: 3 }}>
                <Typography variant="overline" sx={OVERLINE_STYLES.secondary}>
                  <Receipt sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Comprobante de Pago
                </Typography>

                {/* Archivo Actual */}
                {hasAttachedFiles() ? (
                  <Box sx={{ mt: 2 }}>
                    <Alert 
                      severity="success"
                      sx={{ 
                        mb: 2,
                        backgroundColor: alpha(theme.palette.success.main, 0.08),
                        '& .MuiAlert-icon': { color: 'success.main' }
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        📄 Comprobante Actual
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getFileName()}
                      </Typography>
                    </Alert>

                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
                        {getFileIcon(getFileName())}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {getFileName()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Archivo de comprobante
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={uploadingFile ? <CircularProgress size={16} /> : <Delete />}
                        onClick={handleFileRemove}
                        disabled={uploadingFile}
                        sx={{ borderRadius: 1 }}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Alert 
                    severity="info"
                    sx={{ 
                      mt: 2,
                      mb: 2,
                      backgroundColor: alpha(theme.palette.info.main, 0.08),
                      '& .MuiAlert-icon': { color: 'info.main' }
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      📄 Sin Comprobante
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      No hay comprobante adjunto para este compromiso.
                    </Typography>
                  </Alert>
                )}

                {/* Subir Nuevo Archivo */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="overline" sx={OVERLINE_STYLES.secondary}>
                    <CloudUpload sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {hasAttachedFiles() ? 'Reemplazar Comprobante' : 'Subir Comprobante'}
                  </Typography>
                  
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      htmlFor="file-upload-input"
                      startIcon={<CloudUpload />}
                      fullWidth
                      sx={{ 
                        borderRadius: 1,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        py: 2,
                        '&:hover': {
                          borderStyle: 'dashed',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      Seleccionar Archivo
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Formatos: PDF, JPG, PNG, WebP • Máximo: 5MB
                    </Typography>
                  </Box>

                  {/* Preview del archivo seleccionado */}
                  <AnimatePresence>
                    {fileToUpload && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Paper 
                          elevation={0}
                          sx={{ 
                            mt: 2,
                            p: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                              {getFileIcon(fileToUpload.name)}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {fileToUpload.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                          </Box>

                          {/* Preview de imagen */}
                          {filePreview && (
                            <Box sx={{ mt: 2 }}>
                              <img 
                                src={filePreview} 
                                alt="Preview" 
                                style={{ 
                                  width: '100%', 
                                  maxHeight: '200px', 
                                  objectFit: 'contain',
                                  borderRadius: '8px'
                                }} 
                              />
                            </Box>
                          )}

                          <Box display="flex" gap={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={uploadingFile ? <CircularProgress size={16} /> : <CloudUpload />}
                              onClick={handleFileUpload}
                              disabled={uploadingFile}
                              sx={{ borderRadius: 1 }}
                            >
                              {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setFileToUpload(null);
                                setFilePreview(null);
                                const fileInput = document.getElementById('file-upload-input');
                                if (fileInput) fileInput.value = '';
                              }}
                              sx={{ borderRadius: 1 }}
                            >
                              Cancelar
                            </Button>
                          </Box>
                        </Paper>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Paper>
            </Grid>
            
          </Grid>
        </Box>
      </DialogContent>

      {/* Actions con estructura exacta del Design System */}
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50]
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{ 
            borderRadius: 1,
            borderColor: alpha(theme.palette.error.main, 0.5),
            color: theme.palette.error.main,
            '&:hover': {
              borderColor: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.08)
            }
          }}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !hasChanges || !formData.concept.trim() || !formData.totalAmount}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          sx={{ 
            borderRadius: 1,
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitmentEditFormComplete;
