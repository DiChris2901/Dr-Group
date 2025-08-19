import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Business as CompanyIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as InterestIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NewPaymentPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  
  // Helper para crear fecha local sin problemas de zona horaria
  const createLocalDate = (dateString) => {
    if (!dateString) return new Date();
    
    // Si es una fecha en formato YYYY-MM-DD del input
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month - 1 porque Date usa base 0 para meses
    }
    
    return new Date(dateString);
  };
  
  // Estado para compromisos pendientes
  const [pendingCommitments, setPendingCommitments] = useState([]);
  const [loadingCommitments, setLoadingCommitments] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  
  // Estado para empresas y cuentas bancarias
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const [formData, setFormData] = useState({
    commitmentId: '',
    method: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    sourceAccount: '', // NUEVO: cuenta de origen del pago
    sourceBank: '',    // NUEVO: banco de origen (se autocompleta)
    // Campos calculados automáticamente
    originalAmount: 0,
    interests: 0,
    // Campos específicos para Coljuegos
    interesesDerechosExplotacion: 0,
    interesesGastosAdministracion: 0,
    finalAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para archivos
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Cargar compromisos pendientes de pago
  useEffect(() => {
    loadPendingCommitments();
  }, []);

  // Cargar empresas con cuentas bancarias
  useEffect(() => {
    loadCompanies();
  }, []);

  // Limpiar intereses cuando la fecha ya no los requiere
  useEffect(() => {
    if (selectedCommitment && formData.date) {
      const needsInterests = requiresInterests(selectedCommitment, formData.date);
      
      if (!needsInterests) {
        // Limpiar todos los tipos de intereses si no se requieren
        setFormData(prev => ({
          ...prev,
          interests: 0,
          interesesDerechosExplotacion: 0,
          interesesGastosAdministracion: 0,
          finalAmount: prev.originalAmount
        }));
      }
    }
  }, [formData.date, selectedCommitment]);

  const loadPendingCommitments = async () => {
    try {
      setLoadingCommitments(true);
      
      // Consultar todos los compromisos
      const commitmentsQuery = query(
        collection(db, 'commitments')
      );
      
      const snapshot = await getDocs(commitmentsQuery);
      const commitments = [];
      
      // También consultar todos los pagos para verificar cuáles compromisos ya tienen pago
      const paymentsQuery = query(
        collection(db, 'payments')
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const commitmentsWithPayments = new Set();
      
      // Crear set de commitmentIds que ya tienen pagos
      paymentsSnapshot.forEach((doc) => {
        const paymentData = doc.data();
        if (paymentData.commitmentId) {
          commitmentsWithPayments.add(paymentData.commitmentId);
        }
      });
      
      console.log('📊 Compromisos que ya tienen pagos:', Array.from(commitmentsWithPayments));
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtrar solo compromisos pendientes o vencidos Y que NO tengan pagos registrados Y que no estén marcados como pagados
        const status = data.status || 'pending';
        const isPaid = data.paid === true || data.isPaid === true || status === 'paid';
        const hasPayment = commitmentsWithPayments.has(doc.id);
        
        if ((status === 'pending' || status === 'overdue') && !hasPayment && !isPaid) {
          console.log('📄 Compromiso sin pago encontrado:', doc.id, data);
          commitments.push({
            id: doc.id,
            ...data,
            // Formatear datos para el display
            displayName: `${data.companyName || 'Sin empresa'} - ${data.concept || data.name || 'Sin concepto'}`,
            formattedDueDate: data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha',
            formattedAmount: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(data.amount || 0)
          });
        } else if (hasPayment || isPaid) {
          console.log('🚫 Compromiso omitido (ya pagado):', doc.id, data.concept, { hasPayment, isPaid, status });
        }
      });
      
      // Ordenar por fecha de vencimiento
      commitments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.toDate() - b.dueDate.toDate();
      });
      
      console.log(`📋 Total compromisos sin pago: ${commitments.length}`);
      setPendingCommitments(commitments);
    } catch (error) {
      console.error('Error loading pending commitments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los compromisos pendientes',
        icon: 'error'
      });
    } finally {
      setLoadingCommitments(false);
    }
  };

  // Cargar empresas con información bancaria
  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesQuery = query(collection(db, 'companies'));
      const snapshot = await getDocs(companiesQuery);
      
      const companiesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        companiesData.push({
          id: doc.id,
          ...data
        });
      });
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      addNotification({
        type: 'error',
        title: 'Error al cargar empresas',
        message: 'No se pudieron cargar las empresas',
        icon: 'error'
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Obtener cuentas bancarias disponibles
  const getBankAccounts = () => {
    return companies
      .filter(company => company.bankAccount && company.bankName)
      .map(company => ({
        id: company.id,
        companyName: company.name,
        bankAccount: company.bankAccount,
        bankName: company.bankName,
        displayText: `${company.bankAccount} - ${company.bankName} (${company.name})`
      }));
  };

  // Manejar selección de cuenta bancaria
  const handleSourceAccountSelect = (selectedAccount) => {
    if (selectedAccount) {
      const accountInfo = getBankAccounts().find(acc => acc.bankAccount === selectedAccount);
      if (accountInfo) {
        setFormData(prev => ({
          ...prev,
          sourceAccount: accountInfo.bankAccount,
          sourceBank: accountInfo.bankName
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        sourceAccount: '',
        sourceBank: ''
      }));
    }
  };

  // Función para formatear moneda
  const formatCurrencyBalance = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Función para calcular y crear registro del 4x1000
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
        notes: `Impuesto 4x1000 generado automáticamente (${formatCurrencyBalance(paymentAmount)} x 0.004)`,
        reference: `4x1000-${Date.now()}`,
        companyName: companyName,
        sourceAccount: sourceAccount,
        sourceBank: sourceBank,
        date: paymentDate,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        is4x1000Tax: true, // Flag para identificar registros de 4x1000
        relatedToPayment: true, // Flag para indicar que es un impuesto relacionado
        tags: ['impuesto', '4x1000', 'automatico']
      };

      // Agregar a la colección de pagos
      const taxRef = await addDoc(collection(db, 'payments'), tax4x1000Data);
      
      console.log('✅ Registro 4x1000 creado:', formatCurrencyBalance(tax4x1000));
      return { amount: tax4x1000, id: taxRef.id };
    } catch (error) {
      console.error('❌ Error creando registro 4x1000:', error);
      return null;
    }
  };

  // Verificar si los intereses requeridos están completos
  const areInterestsComplete = () => {
    // Si no se requieren intereses, siempre está completo
    if (!requiresInterests(selectedCommitment, formData.date)) {
      return true;
    }
    
    // Si se requieren intereses
    if (isColjuegosCommitment(selectedCommitment)) {
      // Para Coljuegos: al menos uno de los dos tipos debe tener valor > 0
      return formData.interesesDerechosExplotacion > 0 || formData.interesesGastosAdministracion > 0;
    } else {
      // Para otros compromisos: debe tener intereses > 0
      return formData.interests > 0;
    }
  };

  // Verificar si la fecha de pago requiere intereses (posterior al vencimiento)
  const requiresInterests = (commitment, paymentDate) => {
    if (!commitment?.dueDate || !paymentDate) return false;
    
    const dueDate = commitment.dueDate.toDate();
    const payment = new Date(paymentDate);
    
    // Resetear horas para comparar solo fechas
    dueDate.setHours(0, 0, 0, 0);
    payment.setHours(0, 0, 0, 0);
    
    console.log('Checking interests requirement:', {
      dueDate: dueDate.toDateString(),
      paymentDate: payment.toDateString(),
      isLater: payment > dueDate
    });
    
    return payment > dueDate;
  };

  // Detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const companyName = commitment.companyName?.toLowerCase() || '';
    const concept = commitment.concept?.toLowerCase() || '';
    
    console.log('Checking Coljuegos for:', { companyName, concept });
    
    // Buscar por nombre de empresa o concepto relacionado a Coljuegos
    const isColjuegos = companyName.includes('coljuegos') || 
           companyName.includes('col juegos') ||
           concept.includes('derechos de explotación') ||
           concept.includes('derechos de explotacion') ||
           concept.includes('gastos de administración') ||
           concept.includes('gastos de administracion');
           
    console.log('Is Coljuegos:', isColjuegos);
    return isColjuegos;
  };

  // Calcular si hay intereses basado en la fecha de pago vs fecha de vencimiento
  const calculateInterestsForPaymentDate = (dueDate, amount, paymentDate) => {
    if (!dueDate || !amount || !paymentDate) return 0;
    
    const due = dueDate.toDate();
    const payment = new Date(paymentDate);
    const diffTime = payment - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si no está vencido en la fecha de pago, no hay intereses
    if (diffDays <= 0) return 0;
    
    // Calcular interés: 1% mensual (0.033% diario) por días de retraso
    const dailyRate = 0.01 / 30; // 1% mensual dividido en 30 días
    const interestAmount = amount * dailyRate * diffDays;
    
    return Math.round(interestAmount);
  };

  // Manejar selección de compromiso
  const handleCommitmentSelect = (commitment) => {
    if (!commitment) {
      setSelectedCommitment(null);
      setFormData(prev => ({
        ...prev,
        commitmentId: '',
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        finalAmount: 0
      }));
      return;
    }

    setSelectedCommitment(commitment);
    
    // No calcular intereses automáticamente, dejar en 0
    const finalAmount = commitment.amount || 0;

    setFormData(prev => ({
      ...prev,
      commitmentId: commitment.id,
      originalAmount: commitment.amount || 0,
      interests: 0,
      interesesDerechosExplotacion: 0,
      interesesGastosAdministracion: 0,
      finalAmount: finalAmount
    }));
  };

  const paymentMethods = [
    'Transferencia',
    'PSE',
    'Efectivo'
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.commitmentId) newErrors.commitmentId = 'Debe seleccionar un compromiso';
    if (!formData.method) newErrors.method = 'El método de pago es requerido';
    if (!formData.reference) newErrors.reference = 'La referencia es requerida';
    if (!formData.date) newErrors.date = 'La fecha es requerida';
    
    // Validar intereses si se requieren
    if (requiresInterests(selectedCommitment, formData.date)) {
      if (!areInterestsComplete()) {
        if (isColjuegosCommitment(selectedCommitment)) {
          newErrors.interests = 'Debe ingresar al menos uno de los tipos de intereses de Coljuegos';
        } else {
          newErrors.interests = 'Debe ingresar el monto de intereses por mora';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('🎯 handleSubmit INICIADO - event:', event);
    
    // Verificar autenticación
    if (!user) {
      addNotification({
        type: 'error',
        title: 'No autenticado',
        message: 'Debe iniciar sesión para registrar pagos',
        icon: 'error'
      });
      return;
    }
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: 'Formulario incompleto',
        message: 'Por favor complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando proceso de pago...');
      console.log('👤 Usuario autenticado:', user?.uid, user?.email);
      console.log('📋 Selected commitment completo:', JSON.stringify(selectedCommitment, null, 2));
      console.log('📝 Form data completo:', JSON.stringify(formData, null, 2));
      
      // Subir archivos primero
      console.log('📎 Subiendo archivos...');
      const uploadedFileUrls = await uploadFiles();
      console.log('✅ Archivos subidos:', uploadedFileUrls);
      
      // Preparar datos del pago incluyendo URLs de archivos
      const paymentData = {
        commitmentId: selectedCommitment.id,
        companyName: selectedCommitment.companyName || selectedCommitment.company || 'Sin empresa',
        concept: selectedCommitment.name || selectedCommitment.concept || selectedCommitment.description || 'Sin concepto',
        amount: formData.finalAmount || 0,
        originalAmount: formData.originalAmount || 0,
        interests: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
        method: formData.method || '',
        reference: formData.reference || '',
        date: Timestamp.fromDate(createLocalDate(formData.date)),
        notes: formData.notes || '',
        sourceAccount: formData.sourceAccount || '',  // NUEVO: cuenta de origen
        sourceBank: formData.sourceBank || '',        // NUEVO: banco de origen
        status: 'completed',
        attachments: uploadedFileUrls || [],
        processedBy: user.uid,
        processedByEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Validar que los campos críticos no estén vacíos
      console.log('🔍 Validando paymentData antes de guardar:', paymentData);
      
      if (!paymentData.commitmentId) {
        throw new Error('ID del compromiso no válido');
      }
      if (!paymentData.concept || paymentData.concept === 'Sin concepto') {
        console.warn('⚠️ Concepto no encontrado en selectedCommitment:', selectedCommitment);
      }
      
      // Guardar el pago en la colección payments
      console.log('💾 Guardando pago en Firebase:', paymentData);
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('✅ Pago guardado con ID:', paymentRef.id);
      
      // =====================================================
      // GENERAR 4x1000 AUTOMÁTICAMENTE (SI APLICA)
      // =====================================================
      // Solo generar 4x1000 si:
      // 1. Es transferencia bancaria
      // 2. Tiene cuenta de origen definida
      // 3. El monto es mayor a 0
      if (paymentData.method === 'Transferencia' && 
          paymentData.sourceAccount && 
          paymentData.amount > 0) {
        
        console.log('💰 Generando 4x1000 para transferencia de:', formatCurrencyBalance(paymentData.amount));
        
        const tax4x1000Result = await create4x1000Record(
          paymentData.amount,
          paymentData.sourceAccount,
          paymentData.sourceBank,
          paymentData.companyName,
          paymentData.date
        );

        if (tax4x1000Result) {
          console.log('ℹ️ 4x1000 generado automáticamente:', formatCurrencyBalance(tax4x1000Result.amount));
        }
      }
      
      // Actualizar el compromiso como pagado
      console.log('🔄 Actualizando compromiso como pagado...');
      const commitmentRef = doc(db, 'commitments', selectedCommitment.id);
      await updateDoc(commitmentRef, {
        isPaid: true,
        paid: true,
        paymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
        paidAt: Timestamp.fromDate(createLocalDate(formData.date)), // También agregar paidAt para compatibilidad
        paymentAmount: formData.finalAmount,
        paymentId: paymentRef.id,
        interestPaid: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
        paymentMethod: formData.method,
        paymentReference: formData.reference,
        paymentNotes: formData.notes,
        receiptUrl: uploadedFileUrls && uploadedFileUrls.length > 0 ? uploadedFileUrls[0] : null, // Primer archivo para compatibilidad
        receiptUrls: uploadedFileUrls || [], // Todos los archivos
        receiptMetadata: uploadedFileUrls ? uploadedFileUrls.map(url => ({
          url: url,
          uploadedAt: new Date(),
          type: url.includes('.pdf') ? 'pdf' : 'image'
        })) : [],
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ Compromiso actualizado como pagado');
      
      // Recargar la lista de compromisos para quitar el que acaba de ser pagado
      await loadPendingCommitments();
      
      addNotification({
        type: 'success',
        title: 'Pago registrado exitosamente',
        message: `Pago de $${formData.finalAmount.toLocaleString()} registrado para ${selectedCommitment.companyName}`,
        icon: 'success'
      });
      
      // Limpiar el formulario para permitir otro pago
      setSelectedCommitment(null);
      setFormData({
        commitmentId: '',
        method: '',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        finalAmount: 0
      });
      setFiles([]);
      
      // Opcional: navegar a pagos después de 2 segundos
      setTimeout(() => {
        navigate('/payments');
      }, 2000);
    } catch (error) {
      console.error('Error guardando pago:', error);
      addNotification({
        type: 'error',
        title: 'Error al registrar pago',
        message: `No se pudo guardar el pago: ${error.message}`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  // Funciones para manejo de archivos
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
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    // Filtrar solo archivos de imagen y PDF
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== newFiles.length) {
      addNotification({
        type: 'warning',
        title: 'Archivos filtrados',
        message: 'Solo se permiten imágenes (JPG, PNG) y PDFs menores a 10MB',
        icon: 'warning'
      });
    }

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
      url: null
    }))]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Función para convertir imagen a PDF
  const imageToPdf = async (imageFile) => {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await imageFile.arrayBuffer();
    
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Tipo de imagen no soportado');
    }

    // Crear página con el tamaño de la imagen
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });

    return pdfDoc;
  };

  // Función para combinar todos los archivos en un solo PDF
  const combineFilesToPdf = async (files) => {
    try {
      const mainPdfDoc = await PDFDocument.create();

      for (const fileData of files) {
        const file = fileData.file;
        
        if (file.type === 'application/pdf') {
          // Si es PDF, copiarlo al documento principal
          const pdfBytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mainPdfDoc.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        } else if (file.type.startsWith('image/')) {
          // Si es imagen, convertirla a PDF primero
          const imagePdf = await imageToPdf(file);
          const copiedPages = await mainPdfDoc.copyPages(imagePdf, imagePdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        }
      }

      // Generar el PDF combinado
      const pdfBytes = await mainPdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error combining files:', error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    setUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload;
      let fileName;

      if (files.length === 1) {
        // Si solo hay un archivo, subirlo directamente
        fileToUpload = files[0].file;
        fileName = files[0].name;
      } else {
        // Si hay múltiples archivos, combinarlos en un PDF
        setUploadProgress(25); // Progreso durante la combinación
        
        addNotification({
          type: 'info',
          title: 'Combinando archivos',
          message: 'Creando PDF combinado con todos los comprobantes...',
          icon: 'info'
        });

        const combinedPdf = await combineFilesToPdf(files);
        fileToUpload = combinedPdf;
        fileName = `comprobantes_pago_${Date.now()}.pdf`;
        
        setUploadProgress(50); // Progreso después de combinar
      }

      // Crear referencia para el archivo
      const timestamp = Date.now();
      const finalFileName = `payments/${timestamp}_${fileName}`;
      const storageRef = ref(storage, finalFileName);

      setUploadProgress(75); // Progreso antes de subir

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100); // Completado

      addNotification({
        type: 'success',
        title: 'Comprobante subido',
        message: files.length > 1 
          ? `${files.length} archivos combinados y subidos como PDF único`
          : 'Comprobante subido exitosamente',
        icon: 'success'
      });

      // Marcar todos los archivos como subidos
      setFiles(prev => prev.map(f => ({ ...f, uploaded: true, url: downloadURL })));

      return [downloadURL];
    } catch (error) {
      console.error('Error uploading files:', error);
      addNotification({
        type: 'error',
        title: 'Error de carga',
        message: 'Hubo un error al procesar y subir los archivos',
        icon: 'error'
      });
      return [];
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const steps = ['Seleccionar Compromiso', 'Información del Pago', 'Confirmación'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          💳 Registrar Pago de Compromiso
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione un compromiso pendiente y registre su pago
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={selectedCommitment ? 1 : 0} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Información Principal */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Seleccionar Compromiso Pendiente
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Selector de Compromiso Pendiente */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={pendingCommitments}
                      getOptionLabel={(option) => option.displayName || ''}
                      loading={loadingCommitments}
                      value={selectedCommitment}
                      onChange={(event, newValue) => handleCommitmentSelect(newValue)}
                      noOptionsText={
                        loadingCommitments 
                          ? "Cargando compromisos..." 
                          : "No hay compromisos pendientes sin pago registrado"
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Compromiso a Pagar"
                          placeholder={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "No hay compromisos disponibles para pagar..."
                              : "Seleccione un compromiso pendiente..."
                          }
                          fullWidth
                          required
                          helperText={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "Solo se muestran compromisos pendientes que aún no tienen pagos registrados"
                              : ""
                          }
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CompanyIcon color="primary" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <>
                                {loadingCommitments ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <li key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {option.companyName}
                                </Typography>
                                <Chip 
                                  label={option.formattedAmount} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {option.concept}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="warning.main">
                                  Vencimiento: {option.formattedDueDate}
                                </Typography>
                              </Box>
                            </Box>
                          </li>
                        );
                      }}
                    />
                  </Grid>

                  {/* Información del Compromiso Seleccionado */}
                  {selectedCommitment && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          📋 Detalles del Compromiso Seleccionado
                          {/* Indicador temporal para depuración */}
                          {isColjuegosCommitment(selectedCommitment) && (
                            <Chip 
                              label="COLJUEGOS DETECTED" 
                              color="secondary" 
                              size="small" 
                              sx={{ ml: 2 }}
                            />
                          )}
                        </Typography>
                        
                        {/* Información del compromiso */}
                        <Box sx={{ mb: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Concepto:</strong> {selectedCommitment.concept}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="warning.main">
                                <strong>Fecha de Vencimiento:</strong> {selectedCommitment.formattedDueDate}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Valor Original"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.originalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 600,
                              color: 'success.main'
                            }
                          }}
                        />
                      </Grid>

                      {/* Campos de Intereses - Solo cuando la fecha de pago es posterior al vencimiento */}
                      {requiresInterests(selectedCommitment, formData.date) ? (
                        <>
                          {(() => {
                            const isColj = isColjuegosCommitment(selectedCommitment);
                            console.log('Rendering interest fields - Is Coljuegos:', isColj);
                            return isColj;
                          })() ? (
                            <>
                              {/* Intereses específicos para Coljuegos */}
                              <Grid item xs={12}>
                                <Typography variant="body2" color="info.main" sx={{ mb: 1, fontStyle: 'italic' }}>
                                  ⚠️ Pago posterior al vencimiento - Se requieren intereses específicos de Coljuegos
                                </Typography>
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Derechos de Explotación"
                                  value={formData.interesesDerechosExplotacion}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesDerechosExplotacion: value,
                                      finalAmount: prev.originalAmount + value + prev.interesesGastosAdministracion
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  error={errors.interests && formData.interesesDerechosExplotacion === 0 && formData.interesesGastosAdministracion === 0}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="warning" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interesesDerechosExplotacion > 0 ? 'warning.main' : 'text.secondary'
                                    }
                                  }}
                                  helperText="Intereses específicos para derechos de explotación"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Gastos de Administración"
                                  value={formData.interesesGastosAdministracion}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesGastosAdministracion: value,
                                      finalAmount: prev.originalAmount + prev.interesesDerechosExplotacion + value
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  error={errors.interests && formData.interesesDerechosExplotacion === 0 && formData.interesesGastosAdministracion === 0}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="error" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interesesGastosAdministracion > 0 ? 'error.main' : 'text.secondary'
                                    }
                                  }}
                                  helperText="Intereses específicos para gastos de administración"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Total Intereses Coljuegos"
                                  value={new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                  }).format(formData.interesesDerechosExplotacion + formData.interesesGastosAdministracion)}
                                  fullWidth
                                  disabled
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="secondary" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 700,
                                      color: 'secondary.main'
                                    }
                                  }}
                                  helperText="Suma de ambos tipos de intereses"
                                />
                              </Grid>
                            </>
                          ) : (
                            <>
                              {/* Intereses regulares para otros compromisos */}
                              <Grid item xs={12}>
                                <Typography variant="body2" color="warning.main" sx={{ mb: 1, fontStyle: 'italic' }}>
                                  ⚠️ Pago posterior al vencimiento - Se pueden aplicar intereses por mora
                                </Typography>
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label="Intereses por Mora"
                                  value={formData.interests}
                                  onChange={(e) => {
                                    const interestValue = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: interestValue,
                                      finalAmount: prev.originalAmount + interestValue
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  error={errors.interests && formData.interests === 0}
                                  helperText={errors.interests && formData.interests === 0 ? "Este campo es requerido para pagos tardíos" : "Ingrese el monto de intereses por mora"}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="warning" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interests > 0 ? 'warning.main' : 'text.secondary'
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                {/* Espacio vacío para mantener layout */}
                              </Grid>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Mensaje cuando no se requieren intereses */}
                          <Grid item xs={12}>
                            <Alert severity="success" sx={{ mt: 1 }}>
                              ✅ Pago a tiempo - No se requieren intereses adicionales
                            </Alert>
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Total a Pagar"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.finalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon color="error" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 700,
                              color: 'error.main',
                              fontSize: '1.1rem'
                            },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.error.main + '10',
                              '& fieldset': {
                                borderColor: theme.palette.error.main,
                                borderWidth: 2
                              }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          💳 Información del Pago
                        </Typography>
                      </Grid>

                      {/* Campo de cuenta de origen */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.sourceAccount}>
                          <InputLabel>Cuenta de Origen</InputLabel>
                          <Select
                            value={formData.sourceAccount}
                            label="Cuenta de Origen"
                            onChange={(e) => handleSourceAccountSelect(e.target.value)}
                            disabled={loadingCompanies}
                          >
                            <MenuItem value="">
                              <em>Seleccionar cuenta de origen</em>
                            </MenuItem>
                            {getBankAccounts().map((account) => (
                              <MenuItem 
                                key={`${account.id}-${account.bankAccount}`} 
                                value={account.bankAccount}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {account.bankAccount}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {account.bankName} - {account.companyName}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                            {getBankAccounts().length === 0 && (
                              <MenuItem disabled>
                                <Typography variant="body2" color="text.secondary">
                                  {loadingCompanies ? 'Cargando...' : 'No hay cuentas bancarias registradas'}
                                </Typography>
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Campo de banco (autocompletado) */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Banco de Origen"
                          value={formData.sourceBank}
                          fullWidth
                          disabled={true}
                          placeholder="Se autocompleta al seleccionar cuenta"
                          helperText="Se completa automáticamente al seleccionar una cuenta"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.action.hover,
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                              color: theme.palette.text.secondary
                            }
                          }}
                        />
                      </Grid>

                      {/* Mensaje informativo sobre cuentas bancarias */}
                      {getBankAccounts().length === 0 && !loadingCompanies && (
                        <Grid item xs={12}>
                          <Alert 
                            severity="info" 
                            sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                              border: `1px solid rgba(25, 118, 210, 0.2)`,
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              💡 Consejo
                            </Typography>
                            <Typography variant="caption">
                              Para registrar cuentas de origen, primero agrega la información bancaria en la sección de Empresas. 
                              Allí puedes agregar número de cuenta, banco y certificación bancaria de cada empresa.
                            </Typography>
                          </Alert>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.method}>
                          <InputLabel>Método de Pago</InputLabel>
                          <Select
                            value={formData.method}
                            onChange={handleInputChange('method')}
                            label="Método de Pago"
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Referencia/ID del Pago"
                          value={formData.reference}
                          onChange={handleInputChange('reference')}
                          fullWidth
                          error={!!errors.reference}
                          helperText={errors.reference}
                          placeholder="Ej: TRF-2025-001, CHE-12345"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Fecha del Pago"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange('date')}
                          fullWidth
                          error={!!errors.date}
                          helperText={errors.date}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Observaciones"
                          value={formData.notes}
                          onChange={handleInputChange('notes')}
                          fullWidth
                          multiline
                          rows={1}
                          placeholder="Notas adicionales sobre el pago..."
                        />
                      </Grid>

                      {/* Sección de carga de archivos */}
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          📎 Comprobantes de Pago
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        {/* Zona de drag & drop */}
                        <Card 
                          sx={{ 
                            border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderColor: 'primary.main'
                            }
                          }}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <input
                              type="file"
                              multiple
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleFileSelect}
                              style={{ display: 'none' }}
                              id="file-upload"
                            />
                            <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                Arrastra archivos aquí o haz clic para seleccionar
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Formatos permitidos: JPG, PNG, PDF (máx. 10MB cada uno)
                              </Typography>
                              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                                💡 Múltiples archivos se combinarán automáticamente en un solo PDF
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<AttachIcon />}
                                sx={{ mt: 2 }}
                                component="span"
                              >
                                Seleccionar Archivos
                              </Button>
                            </label>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Lista de archivos seleccionados */}
                      {files.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            📋 Archivos Seleccionados ({files.length})
                          </Typography>
                          <List dense>
                            {files.map((fileData) => (
                              <ListItem key={fileData.id}>
                                <ListItemIcon>
                                  <FileIcon color={fileData.uploaded ? 'success' : 'default'} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={fileData.name}
                                  secondary={`${Math.round(fileData.size / 1024)} KB - ${fileData.uploaded ? 'Subido' : 'Pendiente'}`}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    onClick={() => removeFile(fileData.id)}
                                    size="small"
                                    disabled={uploading}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}

                      {/* Barra de progreso durante la carga */}
                      {uploading && (
                        <Grid item xs={12}>
                          <Box sx={{ width: '100%', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Subiendo archivos... {uploadProgress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                          </Box>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel de Resumen */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="secondary" />
                  Resumen del Pago
                </Typography>
                
                {selectedCommitment ? (
                  <Box>
                    <Box sx={{ mb: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {selectedCommitment.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCommitment.concept}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Valor Original:</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(formData.originalAmount)}
                      </Typography>
                    </Box>
                    
                    {isColjuegosCommitment(selectedCommitment) ? (
                      <>
                        {/* Mostrar intereses de Coljuegos separados */}
                        {formData.interesesDerechosExplotacion > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Int. Derechos Explotación:</Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interesesDerechosExplotacion)}
                            </Typography>
                          </Box>
                        )}
                        
                        {formData.interesesGastosAdministracion > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Int. Gastos Administración:</Typography>
                            <Typography variant="body2" color="error.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interesesGastosAdministracion)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Mostrar intereses regulares */}
                        {formData.interests > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Intereses:</Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interests)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Total a Pagar:</Typography>
                      <Typography variant="h6" color="error.main">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(formData.finalAmount)}
                      </Typography>
                    </Box>
                    
                    {formData.method && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Método: <strong>{formData.method}</strong>
                        </Typography>
                      </Box>
                    )}

                    {files.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Comprobantes: <strong>
                            {files.length === 1 
                              ? '1 archivo' 
                              : `${files.length} archivos → 1 PDF combinado`
                            }
                          </strong>
                        </Typography>
                        <Typography variant="caption" color={files.every(f => f.uploaded) ? 'success.main' : 'warning.main'}>
                          {files.every(f => f.uploaded) 
                            ? '✓ Comprobante listo' 
                            : files.length > 1 
                              ? '⚠ Se combinarán al registrar' 
                              : '⚠ Pendiente de subir'
                          }
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Seleccione un compromiso para ver el resumen del pago
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de Acción */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            <CancelIcon sx={{ mr: 1 }} />
            Cancelar
          </Button>
          
          <Box sx={{ position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || uploading}
              sx={{ minWidth: 120 }}
              onClick={() => {
                console.log('🔘 Botón clicked - Estado del formulario:');
                console.log('- isSubmitting:', isSubmitting);
                console.log('- uploading:', uploading);
                console.log('- selectedCommitment:', !!selectedCommitment);
                console.log('- areInterestsComplete():', areInterestsComplete());
                console.log('- requiresInterests:', requiresInterests(selectedCommitment, formData.date));
                console.log('- formData:', formData);
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} />
              ) : uploading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Subiendo...
                </>
              ) : (
                <>
                  <SaveIcon sx={{ mr: 1 }} />
                  Registrar Pago
                </>
              )}
            </Button>
            
            {/* Mensaje de ayuda cuando el botón está deshabilitado por intereses */}
            {selectedCommitment && 
             requiresInterests(selectedCommitment, formData.date) && 
             !areInterestsComplete() && (
              <Typography 
                variant="caption" 
                color="warning.main" 
                sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  mt: 0.5,
                  fontStyle: 'italic',
                  fontSize: '0.7rem'
                }}
              >
                ⚠️ Ingrese los intereses para habilitar el pago
              </Typography>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default NewPaymentPage;
