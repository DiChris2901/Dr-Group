import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  InputBase,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  TextField,
  alpha,
  Snackbar,
  Alert as MuiAlert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  MoreVert as MoreVertIcon,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Business as CompanyIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  RemoveRedEye as RemoveRedEyeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';

// Hook para cargar pagos desde Firebase
import { usePayments } from '../hooks/useFirestore';
// Firebase para manejo de archivos y Firestore
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
// Componente temporal para agregar datos de prueba
import AddSamplePayments from '../components/debug/AddSamplePayments';
// Componente para visor de comprobantes de pago
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';

const PaymentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [receiptsFilter, setReceiptsFilter] = useState('all'); // Nuevo filtro para comprobantes
  
  // Estados para el visor de comprobantes
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Estados para edición de archivos
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Estados para edición de pago
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
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
    originalAmount: ''
  });
  
  // Estados adicionales para cargar datos del compromiso
  const [loadingCommitment, setLoadingCommitment] = useState(false);
  const [commitmentData, setCommitmentData] = useState(null);
  
  // Estados para manejo de múltiples archivos y combinación PDF
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Función para cargar datos del compromiso
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

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar pagos reales desde Firebase
  const { payments: firebasePayments, loading, error } = usePayments({ status: statusFilter !== 'all' ? statusFilter : undefined });

  // Usar solo datos reales de Firebase
  const payments = firebasePayments;

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'completado':
        return 'success';
      case 'pending':
      case 'pendiente':
        return 'warning';
      case 'failed':
      case 'fallido':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'completado':
        return <CheckIcon fontSize="small" />;
      case 'pending':
      case 'pendiente':
        return <PendingIcon fontSize="small" />;
      case 'failed':
      case 'fallido':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      case 'completado':
      case 'pendiente':
      case 'fallido':
        return status; // Ya están en español
      default:
        return status || 'Desconocido';
    }
  };

  // Filtrar pagos por término de búsqueda y comprobantes
  const filteredPayments = payments.filter(payment => {
    // Filtro por búsqueda
    let matchesSearch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matchesSearch = (
        payment.companyName?.toLowerCase().includes(searchLower) ||
        payment.concept?.toLowerCase().includes(searchLower) ||
        payment.reference?.toLowerCase().includes(searchLower) ||
        payment.method?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por comprobantes
    let matchesReceipts = true;
    if (receiptsFilter !== 'all') {
      const hasReceipts = !!(
        payment.receiptUrl || 
        (payment.receiptUrls && payment.receiptUrls.length > 0) ||
        (payment.attachments && payment.attachments.length > 0)
      );
      
      matchesReceipts = (receiptsFilter === 'with' && hasReceipts) || 
                       (receiptsFilter === 'without' && !hasReceipts);
    }
    
    return matchesSearch && matchesReceipts;
  });

  // Calcular estadísticas de pagos
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'completado' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'pendiente' || p.status?.toLowerCase() === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Estadísticas de comprobantes
  const paymentsWithReceipts = filteredPayments.filter(payment => 
    !!(payment.receiptUrl || 
       (payment.receiptUrls && payment.receiptUrls.length > 0) ||
       (payment.attachments && payment.attachments.length > 0))
  );
  const paymentsWithoutReceipts = filteredPayments.filter(payment => 
    !(payment.receiptUrl || 
      (payment.receiptUrls && payment.receiptUrls.length > 0) ||
      (payment.attachments && payment.attachments.length > 0))
  );

  // Acentos desde DS (gradients via theme variants y tokenUtils)

  const fadeUp = { initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{duration:.45,ease:'easeOut'} };

  // Paginación (máx 10 registros por página)
  const [page, setPage] = useState(0);
  const [jumpToPage, setJumpToPage] = useState('');
  const rowsPerPage = 10; // fijo según requerimiento

  useEffect(()=>{
    const maxPage = Math.max(0, Math.ceil(filteredPayments.length / rowsPerPage) - 1);
    if(page > maxPage) setPage(0);
  }, [filteredPayments.length, page]);

  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Funciones de navegación de paginación
  const handlePageChange = (newPage) => {
    setPage(newPage - 1); // Pagination component usa base 1, nosotros base 0
  };

  const handleFirstPage = () => setPage(0);
  const handlePrevPage = () => setPage(Math.max(0, page - 1));
  const handleNextPage = () => setPage(Math.min(Math.ceil(filteredPayments.length / rowsPerPage) - 1, page + 1));
  const handleLastPage = () => setPage(Math.ceil(filteredPayments.length / rowsPerPage) - 1);

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    const maxPage = Math.ceil(filteredPayments.length / rowsPerPage);
    if (pageNum >= 1 && pageNum <= maxPage) {
      setPage(pageNum - 1);
      setJumpToPage('');
    }
  };

  const handleJumpToPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // Funciones para el visor de comprobantes
  const handleViewReceipt = (payment) => {
    console.log('📄 Abriendo visor para pago:', payment);
    setSelectedPayment(payment);
    setReceiptViewerOpen(true);
  };

  const handleCloseReceiptViewer = () => {
    setReceiptViewerOpen(false);
    setSelectedPayment(null);
  };

  // Función para mostrar notificaciones
  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Función para eliminar comprobante
  const handleDeleteReceipt = async (payment) => {
    try {
      setUploadingFile(true);
      console.log('🗑️ Iniciando eliminación de comprobante para pago:', payment.id);
      
      // Verificar que el pago tenga comprobantes - usar attachments como campo principal
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      console.log('📄 URLs a eliminar:', receiptUrls);
      console.log('📄 Estructura completa del pago:', {
        attachments: payment.attachments,
        receiptUrls: payment.receiptUrls,
        receiptUrl: payment.receiptUrl,
        files: payment.files
      });
      
      if (receiptUrls.length === 0) {
        showNotification('No hay comprobantes para eliminar', 'warning');
        return;
      }
      
      // Eliminar archivos de Storage
      for (const url of receiptUrls) {
        if (url) {
          try {
            // Extraer el path del archivo desde la URL
            const filePathMatch = url.match(/o\/(.+?)\?/);
            if (filePathMatch) {
              const filePath = decodeURIComponent(filePathMatch[1]);
              console.log('🔥 Eliminando archivo:', filePath);
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
              console.log('✅ Archivo eliminado de Storage');
            }
          } catch (storageError) {
            console.warn('⚠️ Error al eliminar archivo de Storage:', storageError);
          }
        }
      }

      // Actualizar documento en Firestore removiendo las URLs
      const paymentRef = doc(db, 'payments', payment.id);
      await updateDoc(paymentRef, {
        attachments: [], // Campo principal donde se guardan los comprobantes
        receiptUrls: [],
        receiptUrl: null,
        files: [],
        updatedAt: new Date()
      });

      console.log('✅ Comprobante eliminado exitosamente de Firestore');
      
      // Cerrar el visor de PDF si está abierto para este pago
      if (selectedPayment?.id === payment.id) {
        handleCloseReceiptViewer();
      }
      
      showNotification('Comprobante eliminado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error al eliminar comprobante:', error);
      showNotification(`Error al eliminar comprobante: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Función para editar comprobante (reemplazar)
  const handleEditReceipt = (payment) => {
    console.log('✏️ Editando comprobante para pago:', payment.id);
    setEditingReceipt(payment);
    
    // Crear input de archivo temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        setEditingReceipt(null);
        return;
      }

      try {
        setUploadingFile(true);
        console.log('📤 Subiendo nuevos archivos:', files.map(f => f.name));

        // 1. Eliminar archivos antiguos del Storage
        const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
        console.log('🗑️ Eliminando archivos antiguos:', receiptUrls);
        
        for (const url of receiptUrls) {
          if (url) {
            try {
              const filePathMatch = url.match(/o\/(.+?)\?/);
              if (filePathMatch) {
                const filePath = decodeURIComponent(filePathMatch[1]);
                const fileRef = ref(storage, filePath);
                await deleteObject(fileRef);
                console.log('✅ Archivo antiguo eliminado:', filePath);
              }
            } catch (deleteError) {
              console.warn('⚠️ Error al eliminar archivo antiguo:', deleteError);
            }
          }
        }

        // 2. Subir nuevos archivos
        const newReceiptUrls = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = `receipts/${payment.id}_${i + 1}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          
          console.log('⬆️ Subiendo archivo:', fileName);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
          console.log('✅ Archivo subido:', downloadURL);
        }

        // 3. Actualizar documento en Firestore
        const paymentRef = doc(db, 'payments', payment.id);
        await updateDoc(paymentRef, {
          attachments: newReceiptUrls, // Campo principal
          receiptUrls: newReceiptUrls,
          receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad
          updatedAt: new Date()
        });

        console.log('✅ Comprobante editado exitosamente');
        showNotification('Comprobante editado exitosamente', 'success');
      } catch (error) {
        console.error('❌ Error al editar comprobante:', error);
        showNotification(`Error al editar comprobante: ${error.message}`, 'error');
      } finally {
        setUploadingFile(false);
        setEditingReceipt(null);
      }
    };

    input.click();
  };

  // Función para abrir el modal de edición de pago
  const handleEditPayment = async (payment) => {
    console.log('✏️ Editando pago:', payment.id);
    setEditingPayment(payment);
    
    // Cargar datos del compromiso si existe commitmentId
    let providerName = '';
    let commitment = null;
    if (payment.commitmentId) {
      commitment = await loadCommitmentData(payment.commitmentId);
      providerName = commitment?.provider || commitment?.beneficiary || '';
    }
    
    // Determinar si es Coljuegos para mostrar campos específicos
    const isColjuegos = isColjuegosCommitment(commitment);
    
    setEditFormData({
      concept: payment.concept || '',
      amount: formatCurrency(payment.amount || ''),
      method: payment.method || '',
      notes: payment.notes || '',
      reference: payment.reference || '',
      companyName: payment.companyName || '',
      provider: providerName,
      interests: isColjuegos ? '' : formatCurrency(payment.interests || ''),
      interesesDerechosExplotacion: isColjuegos ? formatCurrency(payment.interesesDerechosExplotacion || '') : '',
      interesesGastosAdministracion: isColjuegos ? formatCurrency(payment.interesesGastosAdministracion || '') : '',
      originalAmount: formatCurrency(payment.originalAmount || payment.amount || ''),
      date: payment.date ? 
        (payment.date.toISOString ? payment.date.toISOString().split('T')[0] : 
         new Date(payment.date).toISOString().split('T')[0]) : 
        new Date().toISOString().split('T')[0]
    });
    
    setEditPaymentOpen(true);
  };

  // Función para cerrar el modal de edición
  const handleCloseEditPayment = () => {
    setEditPaymentOpen(false);
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
      originalAmount: ''
    });
  };

  // Función para guardar los cambios del pago
  const handleSavePayment = async () => {
    if (!editingPayment || !editFormData.concept.trim() || !editFormData.amount) {
      showNotification('Por favor completa los campos obligatorios', 'warning');
      return;
    }

    try {
      setUploadingFile(true);
      
      const paymentRef = doc(db, 'payments', editingPayment.id);
      
      // Determinar si es Coljuegos para guardar campos específicos
      const isColjuegos = isColjuegosCommitment(commitmentData);
      
      const updateData = {
        concept: editFormData.concept.trim(),
        amount: parseFloat(cleanCurrency(editFormData.amount)),
        originalAmount: parseFloat(cleanCurrency(editFormData.originalAmount || editFormData.amount)),
        method: editFormData.method,
        notes: editFormData.notes.trim(),
        reference: editFormData.reference?.trim() || '',
        companyName: editFormData.companyName?.trim() || '',
        date: new Date(editFormData.date),
        updatedAt: new Date()
      };

      // Agregar campos de intereses según el tipo
      if (isColjuegos) {
        updateData.interesesDerechosExplotacion = parseFloat(cleanCurrency(editFormData.interesesDerechosExplotacion)) || 0;
        updateData.interesesGastosAdministracion = parseFloat(cleanCurrency(editFormData.interesesGastosAdministracion)) || 0;
        updateData.interests = updateData.interesesDerechosExplotacion + updateData.interesesGastosAdministracion;
      } else {
        updateData.interests = parseFloat(cleanCurrency(editFormData.interests)) || 0;
        updateData.interesesDerechosExplotacion = 0;
        updateData.interesesGastosAdministracion = 0;
      }

      // =====================================================
      // SUBIR COMPROBANTES SELECCIONADOS (SI LOS HAY)
      // =====================================================
      if (selectedFiles.length > 0) {
        console.log('📁 Subiendo comprobantes seleccionados...');
        setUploadProgress(10);
        
        try {
          let fileToUpload;
          let fileName;

          if (selectedFiles.length === 1) {
            // Un solo archivo
            fileToUpload = selectedFiles[0].file;
            fileName = selectedFiles[0].name;
            console.log('📄 Subiendo archivo único:', fileName);
          } else {
            // Múltiples archivos - combinar en PDF
            setUploadProgress(25);
            showNotification('Combinando archivos en PDF único...', 'info');
            
            const combinedPdf = await combineFilesToPdf(selectedFiles);
            fileToUpload = combinedPdf;
            fileName = `comprobantes_editado_${Date.now()}.pdf`;
            console.log('✅ PDF combinado generado:', fileName);
          }

          // Subir a Firebase Storage
          setUploadProgress(50);
          const timestamp = Date.now();
          const finalFileName = `payments/${timestamp}_${fileName}`;
          const storageRef = ref(storage, finalFileName);
          
          console.log('⬆️ Subiendo a Firebase Storage:', finalFileName);
          const snapshot = await uploadBytes(storageRef, fileToUpload);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log('✅ Comprobante subido exitosamente:', downloadURL);
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
          console.error('❌ Error subiendo comprobantes:', uploadError);
          showNotification(`Error subiendo comprobantes: ${uploadError.message}`, 'error');
          setUploadingFile(false);
          setUploadProgress(0);
          return; // Detener ejecución si falla la subida
        }
      }

      // Actualizar documento en Firestore
      setUploadProgress(90);
      await updateDoc(paymentRef, updateData);
      setUploadProgress(100);

      console.log('✅ Pago actualizado exitosamente con comprobantes');
      showNotification(
        selectedFiles.length > 0 
          ? `Pago actualizado y ${selectedFiles.length > 1 ? 'comprobantes combinados' : 'comprobante'} subido exitosamente`
          : 'Pago actualizado exitosamente', 
        'success'
      );
      
      handleCloseEditPayment();
    } catch (error) {
      console.error('❌ Error al actualizar pago:', error);
      showNotification(`Error al actualizar pago: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // Función para formatear números con separadores de miles
  const formatCurrency = (value) => {
    if (!value) return '';
    // Remover todos los caracteres no numéricos
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    // Aplicar formato con puntos separadores de miles
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para limpiar formato de moneda (remover puntos)
  const cleanCurrency = (value) => {
    return value.toString().replace(/\./g, '');
  };

  // Función para detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const provider = commitment.provider || commitment.beneficiary || '';
    return provider.toLowerCase().includes('coljuegos');
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Formateo especial para campos de monto
    if (name === 'amount' || name === 'interests' || name === 'originalAmount' || 
        name === 'interesesDerechosExplotacion' || name === 'interesesGastosAdministracion') {
      const formattedValue = formatCurrency(value);
      setEditFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ========================
  // FUNCIONES PARA MANEJAR MÚLTIPLES ARCHIVOS Y COMBINAR PDFs
  // ========================

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
      throw new Error('Tipo de imagen no soportado: ' + imageFile.type);
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
        const file = fileData.file || fileData;
        
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
      console.error('Error combinando archivos:', error);
      throw error;
    }
  };

  // Función para manejar selección de archivos
  const handleFiles = (newFiles) => {
    // Filtrar solo archivos de imagen y PDF
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== newFiles.length) {
      showNotification('Solo se permiten imágenes (JPG, PNG) y PDFs menores a 10MB', 'warning');
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

  // Función para subir archivos combinados
  const uploadCombinedFiles = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Por favor selecciona al menos un archivo', 'warning');
      return;
    }

    if (!editingPayment) {
      showNotification('Error: No se encontró el pago a editar', 'error');
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
        // Si hay múltiples archivos, combinarlos en un PDF
        setUploadProgress(25);
        showNotification('Combinando archivos en PDF único...', 'info');

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
            ? `${selectedFiles.length} archivos combinados y subidos como PDF único`
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

  return (
    <Box sx={{ p: 2, pb: 4, display:'flex', flexDirection:'column', gap: 2 }}>
      {/* Mostrar indicador de carga */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            Cargando pagos...
          </Typography>
        </Box>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar los pagos: {error}
        </Alert>
      )}

      {/* Mostrar indicador de carga para operaciones de archivos */}
      {uploadingFile && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            {editingReceipt ? 'Editando comprobante...' : 'Eliminando comprobante...'}
          </Box>
        </Alert>
      )}

      {/* Contenido principal - solo se muestra si no hay loading ni error */}
      {!loading && !error && (
        <>
          {/* HEADER COMPACTO */}
          <motion.div {...fadeUp}>
            <Paper sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
              <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, justifyContent:'space-between', alignItems:{ md:'center' }, gap: 1.5 }}>
                <Box sx={{ flex:1 }}>
                  <Typography variant="overline" sx={{ fontWeight:600, fontSize: '0.7rem', color:'text.secondary' }}>FINANZAS • PAGOS</Typography>
                  <Typography variant="h6" sx={{ fontWeight:700, mt: 0.5, mb: 0.5 }}>Gestión de Pagos</Typography>
                  <Typography variant="caption" sx={{ color:'text.secondary' }}>Administra pagos y transacciones corporativas</Typography>
                </Box>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap: 0.8, alignItems:'center' }}>
                  <Chip 
                    size="small" 
                    label={`Total $${totalAmount.toLocaleString()}`} 
                    sx={{ 
                      fontWeight: 600, 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`Comp $${completedAmount.toLocaleString()}`} 
                    color="success" 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`Pend $${pendingAmount.toLocaleString()}`} 
                    color="warning" 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`${filteredPayments.length} pagos`} 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Button 
                    size="small" 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={()=>navigate('/payments/new')} 
                    sx={{ 
                      textTransform:'none', 
                      fontWeight: 600, 
                      borderRadius: 0.5,
                      fontSize: '0.75rem',
                      height: 28,
                      px: 1.5
                    }}
                  >
                    Nuevo
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>          {/* KPIs COMPACTOS */}
          <Grid container spacing={1.5}>
            {[{
              label:'Total Procesado', value:`$${totalAmount.toLocaleString()}`, icon:<MoneyIcon />, color: theme.palette.primary.main
            },{
              label:'Completados', value:`$${completedAmount.toLocaleString()}`, icon:<CheckIcon />, color: theme.palette.success.main
            },{
              label:'Pendientes', value:`$${pendingAmount.toLocaleString()}`, icon:<PendingIcon />, color: theme.palette.warning.main
            },{
              label:'Total Pagos', value:filteredPayments.length, icon:<ReceiptIcon />, color: theme.palette.info.main
            },{
              label:'Con Comprobantes', value:paymentsWithReceipts.length, icon:<AttachFileIcon />, color: theme.palette.success.main
            },{
              label:'Sin Comprobantes', value:paymentsWithoutReceipts.length, icon:<ErrorIcon />, color: theme.palette.error.main
            }].map(card => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
                <Card sx={{ 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s'
                  }
                }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: `${card.color}15`, 
                        color: card.color,
                        '& .MuiSvgIcon-root': { fontSize: 18 }
                      }}>
                        {card.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.9rem',
                          lineHeight: 1.2
                        }}>
                          {card.value}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary', 
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}>
                          {card.label}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* FILTROS COMPACTOS */}
          <motion.div {...fadeUp}>
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              display:'flex', 
              flexWrap:'wrap', 
              gap: 1.5, 
              alignItems:'center', 
              border: '1px solid', 
              borderColor: 'divider' 
            }}>
              <Box sx={{ 
                flex:1, 
                minWidth: 240, 
                display:'flex', 
                alignItems:'center', 
                gap: 1, 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 0.5, 
                border:'1px solid', 
                borderColor: 'divider', 
                backgroundColor: 'background.default' 
              }}>
                <SearchIcon fontSize="small" sx={{ color:'text.secondary', fontSize: 18 }} />
                <InputBase 
                  placeholder="Buscar pagos..." 
                  value={searchTerm} 
                  onChange={e=>setSearchTerm(e.target.value)} 
                  sx={{ 
                    flex:1, 
                    fontSize: '0.8rem',
                    '& input::placeholder': {
                      fontSize: '0.8rem'
                    }
                  }} 
                />
              </Box>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>Estado</InputLabel>
                <Select 
                  value={statusFilter} 
                  onChange={e=>setStatusFilter(e.target.value)} 
                  label="Estado" 
                  sx={{ 
                    borderRadius: 0.5,
                    fontSize: '0.8rem',
                    height: 36
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>Todos</MenuItem>
                  <MenuItem value="completed" sx={{ fontSize: '0.8rem' }}>Completados</MenuItem>
                  <MenuItem value="pending" sx={{ fontSize: '0.8rem' }}>Pendientes</MenuItem>
                  <MenuItem value="failed" sx={{ fontSize: '0.8rem' }}>Fallidos</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>Comprobantes</InputLabel>
                <Select 
                  value={receiptsFilter} 
                  onChange={e=>setReceiptsFilter(e.target.value)} 
                  label="Comprobantes" 
                  sx={{ 
                    borderRadius: 0.5,
                    fontSize: '0.8rem',
                    height: 36
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>Todos</MenuItem>
                  <MenuItem value="with" sx={{ fontSize: '0.8rem' }}>Con comprobantes</MenuItem>
                  <MenuItem value="without" sx={{ fontSize: '0.8rem' }}>Sin comprobantes</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={()=>navigate('/payments/new')} 
                sx={{ 
                  borderRadius: 0.5, 
                  fontWeight: 600,
                  textTransform:'none', 
                  px: 2,
                  fontSize: '0.8rem',
                  height: 36
                }}
              >
                Nuevo Pago
              </Button>
            </Paper>
          </motion.div>

          {/* TABLA ESTILO COMMITMENTS LIST */}
          <motion.div {...fadeUp}>
            <Paper sx={{ 
              borderRadius: 1, 
              overflow:'hidden', 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Header de la tabla */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                gap: 2,
                p: 2,
                bgcolor: alpha(theme.palette.grey[50], 0.8),
                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                {[
                  'ESTADO',
                  'CONCEPTO', 
                  'EMPRESA',
                  'MONTO',
                  'MÉTODO',
                  'FECHA',
                  'REFERENCIA',
                  'ACCIONES'
                ].map((column) => (
                  <Box 
                    key={column}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: column === 'MONTO' || column === 'ACCIONES' ? 'center' : 'flex-start'
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        color: 'text.primary'
                      }}
                    >
                      {column}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Filas de datos */}
              <Box>
                {paginatedPayments.length > 0 ? paginatedPayments.map((payment, index) => (
                  <Box key={payment.id} sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                    gap: 2,
                    p: 2.5,
                    borderBottom: index === paginatedPayments.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.04)}`,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    },
                    alignItems: 'center'
                  }}>
                    {/* Estado */}
                    <Box>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={getStatusText(payment.status)}
                        color={getStatusColor(payment.status)}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          borderRadius: 0.5,
                          '& .MuiChip-icon': { fontSize: 14 }
                        }}
                      />
                    </Box>

                    {/* Concepto */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          mb: 0.5,
                          color: 'text.primary',
                          fontSize: '0.9rem'
                        }}
                      >
                        {payment.concept || 'Sin concepto'}
                      </Typography>
                      {payment.reference && (
                        <Typography 
                          variant="caption" 
                          sx={{
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                          }}
                        >
                          Ref: {payment.reference}
                        </Typography>
                      )}
                    </Box>

                    {/* Empresa */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        {(payment.companyName || 'SC').charAt(0)}
                      </Avatar>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                      >
                        {payment.companyName || 'Sin empresa'}
                      </Typography>
                    </Box>

                    {/* Monto */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        color: 'success.main',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        ${payment.amount?.toLocaleString('es-MX')}
                      </Typography>
                    </Box>

                    {/* Método */}
                    <Box>
                      <Chip 
                        label={payment.method} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          borderRadius: 0.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '& .MuiChip-label': { px: 0.5 }
                        }} 
                      />
                    </Box>

                    {/* Fecha */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {payment.date ? new Date(payment.date.seconds * 1000).toLocaleDateString('es-MX') : '-'}
                      </Typography>
                    </Box>

                    {/* Referencia */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        fontFamily: 'monospace', 
                        color: 'text.secondary',
                        fontSize: '0.7rem'
                      }}>
                        {payment.reference || '-'}
                      </Typography>
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      justifyContent: 'center'
                    }}>
                      <Tooltip title="Ver comprobantes" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleViewReceipt(payment)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Botón para editar los datos del pago (siempre disponible) */}
                      <Tooltip title="Editar pago" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPayment(payment)}
                          disabled={uploadingFile}
                          sx={{ 
                            color: 'info.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Solo mostrar botones de editar/eliminar si hay comprobante */}
                      {(payment.attachments?.length > 0) && (
                        <>
                          <Tooltip title="Editar comprobante" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                console.log('🔍 Datos del pago para edición:', payment);
                                handleEditReceipt(payment);
                              }}
                              disabled={uploadingFile}
                              sx={{ 
                                color: 'warning.main',
                                '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.1) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Eliminar comprobante" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                alert('🔍 BOTÓN CLICKEADO - Revisa la consola');
                                console.log('🔍 DATOS COMPLETOS DEL PAGO:', JSON.stringify(payment, null, 2));
                                console.log('🔍 payment.receiptUrls:', payment.receiptUrls);
                                console.log('🔍 payment.receiptUrl:', payment.receiptUrl);
                                console.log('🔍 payment.attachments:', payment.attachments);
                                handleDeleteReceipt(payment);
                              }}
                              disabled={uploadingFile}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                )) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No hay pagos registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Crea el primer registro con el botón "Nuevo Pago"
                    </Typography>
                    
                    {/* Componente temporal para agregar datos de prueba */}
                    <AddSamplePayments />
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>
                
          {/* PAGINACIÓN SEPARADA ESTILO COMMITMENTS */}
          {Math.ceil(filteredPayments.length / rowsPerPage) > 1 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
              px: 2.5, 
              py: 1.5,
              mt: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Info de paginación y controles adicionales */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1.5} 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                {/* Info detallada */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '0.85rem',
                      lineHeight: 1.2
                    }}
                  >
                    {filteredPayments.length === 0 ? 'Sin pagos' : 
                     `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredPayments.length)} de ${filteredPayments.length}`}
                  </Typography>
                  
                  {filteredPayments.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.75rem',
                        lineHeight: 1.2
                      }}
                    >
                      pagos encontrados
                    </Typography>
                  )}
                </Box>

                {/* Salto directo a página */}
                {Math.ceil(filteredPayments.length / rowsPerPage) > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary', 
                      fontSize: '0.75rem', 
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2
                    }}>
                      Ir a:
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Pág"
                      type="number"
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyDown={handleJumpToPageKeyDown}
                      onBlur={handleJumpToPage}
                      inputProps={{
                        min: 1,
                        max: Math.ceil(filteredPayments.length / rowsPerPage),
                        style: { 
                          textAlign: 'center', 
                          fontSize: '0.75rem',
                          padding: '5px'
                        }
                      }}
                      sx={{
                        width: 55,
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                          borderRadius: 0.5,
                          '& fieldset': {
                            borderColor: alpha(theme.palette.divider, 0.2)
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Stack>

              {/* Controles de paginación */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', sm: 'flex-end' },
                alignItems: 'center',
                gap: 1.5
              }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton
                    onClick={handleFirstPage}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page === 0 ? 'action.disabled' : 'background.paper',
                      color: page === 0 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page !== 0 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <FirstPage fontSize="inherit" />
                  </IconButton>

                  <IconButton
                    onClick={handlePrevPage}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page === 0 ? 'action.disabled' : 'background.paper',
                      color: page === 0 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page !== 0 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <NavigateBefore fontSize="inherit" />
                  </IconButton>

                  <Pagination
                    count={Math.ceil(filteredPayments.length / rowsPerPage)}
                    page={page + 1}
                    onChange={(event, newPage) => handlePageChange(newPage)}
                    color="primary"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        minWidth: 30,
                        height: 30,
                        borderRadius: 0.5,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-0.5px)',
                          boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                        }
                      },
                      '& .MuiPaginationItem-page.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.3)',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)'
                        }
                      },
                      '& .MuiPaginationItem-ellipsis': {
                        color: 'text.secondary',
                        fontSize: '0.75rem'
                      },
                      '& .MuiPaginationItem-icon': {
                        fontSize: 16
                      }
                    }}
                  />

                  <IconButton
                    onClick={handleNextPage}
                    disabled={page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'action.disabled' : 'background.paper',
                      color: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page < Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <NavigateNext fontSize="inherit" />
                  </IconButton>

                  <IconButton
                    onClick={handleLastPage}
                    disabled={page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'action.disabled' : 'background.paper',
                      color: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page < Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <LastPage fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Visor de comprobantes de pago */}
      <PaymentReceiptViewer
        open={receiptViewerOpen}
        onClose={handleCloseReceiptViewer}
        commitment={selectedPayment ? {
          id: selectedPayment.commitmentId,
          companyName: selectedPayment.companyName,
          concept: selectedPayment.concept,
          amount: selectedPayment.amount,
          paidAt: selectedPayment.date, // date del pago -> paidAt
          paymentMethod: selectedPayment.method,
          paymentNotes: selectedPayment.notes,
          receiptUrl: selectedPayment.attachments && selectedPayment.attachments.length > 0 ? selectedPayment.attachments[0] : null,
          receiptUrls: selectedPayment.attachments || []
        } : null}
      />

      {/* Modal de edición de pago - COMPLETO ESTILO NEWPAYMENTPAGE */}
      <Dialog
        open={editPaymentOpen}
        onClose={handleCloseEditPayment}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <EditIcon color="primary" />
          Editar Pago - {editingPayment?.companyName}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 0 }}>
          <Grid container spacing={4}>
            {/* Columna Izquierda - Información del Pago */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                📊 Datos del Pago
              </Typography>
              
              <Stack spacing={3}>
                {/* Empresa/Cliente (a quién le corresponde el pago) */}
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
                      borderRadius: 2
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
                      borderRadius: 2,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
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
                      borderRadius: 2
                    }
                  }}
                />
                
                {/* Montos - Layout dinámico según tipo de compromiso */}
                {isColjuegosCommitment(commitmentData) ? (
                  // Layout para Coljuegos (4 campos)
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
                          <Typography sx={{ mr: 1, color: 'primary.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto base del compromiso"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />

                    <Stack direction="row" spacing={2}>
                      <TextField
                        name="interesesDerechosExplotacion"
                        label="Derechos de Explotación"
                        type="text"
                        fullWidth
                        value={editFormData.interesesDerechosExplotacion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ mr: 1, color: 'warning.main', fontWeight: 600 }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Intereses por derechos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />

                      <TextField
                        name="interesesGastosAdministracion"
                        label="Gastos de Administración"
                        type="text"
                        fullWidth
                        value={editFormData.interesesGastosAdministracion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ mr: 1, color: 'warning.main', fontWeight: 600 }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Gastos administrativos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
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
                          borderRadius: 2
                        }
                      }}
                    />
                  </>
                ) : (
                  // Layout para compromisos normales (3 campos)
                  <Stack direction="row" spacing={2}>
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
                          <Typography sx={{ mr: 1, color: 'primary.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto base del compromiso"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
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
                          borderRadius: 2
                        }
                      }}
                    />
                    
                    <TextField
                      name="amount"
                      label="Monto Total Pagado"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.amount}
                      onChange={handleFormChange}
                      variant="outlined"
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
                          borderRadius: 2
                        }
                      }}
                    />
                  </Stack>
                )}
                
                {/* Método de Pago */}
                <FormControl fullWidth required>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    name="method"
                    value={editFormData.method}
                    onChange={handleFormChange}
                    label="Método de Pago"
                    sx={{
                      borderRadius: 2
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
                        PSE (Pagos Seguros en Línea)
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

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
                  helperText="Fecha en que se realizó el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                {/* Referencia/Número */}
                <TextField
                  name="reference"
                  label="Referencia/Número (Opcional)"
                  fullWidth
                  value={editFormData.reference || ''}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Ej: Transferencia #123456, Cheque #001"
                  helperText="Número de referencia del pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                {/* Notas */}
                <TextField
                  name="notes"
                  label="Notas Adicionales (Opcional)"
                  multiline
                  rows={4}
                  fullWidth
                  value={editFormData.notes}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Agregar observaciones, condiciones especiales, o información relevante sobre este pago..."
                  helperText="Información adicional sobre el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Stack>
            </Grid>

            {/* Columna Derecha - Comprobantes */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                📎 Comprobantes de Pago
              </Typography>

              {/* Área de carga de comprobantes */}
              <Paper
                elevation={0}
                sx={{
                  border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.primary.main + '40'}`,
                  borderRadius: 4,
                  p: 4,
                  textAlign: 'center',
                  background: dragActive ? 
                    alpha(theme.palette.primary.main, 0.08) : 
                    alpha(theme.palette.primary.main, 0.02),
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => document.getElementById('receipt-upload-edit').click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                </motion.div>
                
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  {dragActive ? 'Suelta los archivos aquí' : 'Subir Comprobantes'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Arrastra aquí tus archivos o haz clic para seleccionar
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>
                  Formatos soportados: PDF, JPG, PNG
                  <br />
                  Máximo 10MB por archivo
                </Typography>

                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  💡 Múltiples archivos se combinarán automáticamente en un solo PDF
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                    📋 Archivos Seleccionados ({selectedFiles.length})
                  </Typography>
                  <List dense>
                    {selectedFiles.map((fileData) => (
                      <ListItem key={fileData.id}>
                        <ListItemIcon>
                          <FileIcon color={fileData.uploaded ? 'success' : 'default'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={fileData.name}
                          secondary={`${(fileData.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => removeFile(fileData.id)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  {/* Información sobre múltiples archivos */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          📋 Archivos seleccionados
                        </Typography>
                        <Typography variant="caption">
                          {selectedFiles.length > 1 
                            ? `${selectedFiles.length} archivos se combinarán automáticamente en un PDF único al guardar cambios`
                            : '1 archivo se subirá al guardar cambios'
                          }
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedFiles([])}
                        sx={{ 
                          color: 'info.contrastText', 
                          borderColor: 'info.contrastText',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'info.contrastText'
                          }
                        }}
                      >
                        Limpiar
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Mostrar comprobantes actuales si existen */}
              {editingPayment?.attachments?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                    📋 Comprobantes Actuales:
                  </Typography>
                  {editingPayment.attachments.map((attachment, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        p: 2,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <FileIcon color="success" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Comprobante {index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attachment.slice(-20)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => window.open(attachment, '_blank')}
                        sx={{ color: 'primary.main' }}
                      >
                        <ReceiptIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
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

        <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
          <Button
            onClick={handleCloseEditPayment}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePayment}
            variant="contained"
            startIcon={uploadingFile ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={!editFormData.concept || !editFormData.amount || !editFormData.method || !editFormData.companyName || uploadingFile}
            sx={{ 
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #999 0%, #777 100%)',
                transform: 'none'
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
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PaymentsPage;
