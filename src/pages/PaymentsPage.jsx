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
  ListItemSecondaryAction,
  Menu,
  Popover,
  Fade,
  Grow,
  Slide,
  Divider,
  ListItemButton
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
  RemoveRedEye as RemoveRedEyeIcon,
  SwapHoriz as SwapIcon,
  AttachEmail as AttachEmailIcon,
  Menu as MenuIcon,
  Visibility,
  Edit,
  Delete,
  CloudUpload,
  DragHandle as DragIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';

// Hook para cargar pagos desde Firebase
import { usePayments } from '../hooks/useFirestore';
// Firebase para manejo de archivos y Firestore
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
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
  
  // Estados para menú contextual de acciones
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  
  // Estados para modal de gestión de comprobantes
  const [receiptManagementOpen, setReceiptManagementOpen] = useState(false);
  const [receiptDragActive, setReceiptDragActive] = useState(false);
  
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

  // Helper para formatear fechas de diferentes fuentes
  const formatPaymentDate = (date) => {
    if (!date) return '-';
    
    // Debug temporal
    console.log('Formato de fecha recibido:', date, typeof date, date instanceof Date);
    
    try {
      let dateObj;
      
      // Si ya es un objeto Date (que es lo que debería venir del hook)
      if (date instanceof Date) {
        dateObj = date;
      }
      // Si es un Timestamp de Firebase con seconds
      else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Si es un string de fecha ISO (usar fecha local)
      else if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateObj = createLocalDate(date); // Usar fecha local
        } else {
          dateObj = new Date(date);
        }
      }
      // Si es un timestamp numérico
      else if (typeof date === 'number') {
        dateObj = new Date(date);
      }
      // Otros casos
      else {
        console.log('Formato de fecha no reconocido:', date);
        return '-';
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
        console.log('Fecha inválida después de conversión:', dateObj);
        return '-';
      }
      
      const formattedDate = dateObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      console.log('Fecha original:', date, '-> Fecha formateada:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.warn('Error formateando fecha:', error, date);
      return '-';
    }
  };

  // Helper para convertir fecha a formato ISO para inputs (usando fecha local)
  const formatDateForInput = (date) => {
    if (!date) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    try {
      let dateObj;
      
      // Si ya es un objeto Date
      if (date instanceof Date) {
        dateObj = date;
      }
      // Si es un Timestamp de Firebase con seconds
      else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Si es un string de fecha
      else if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date; // Ya está en el formato correcto
        }
        dateObj = createLocalDate(date); // Usar fecha local
      }
      // Si es un timestamp numérico
      else if (typeof date === 'number') {
        dateObj = new Date(date);
      }
      // Otros casos - usar fecha actual
      else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Convertir usando componentes locales para evitar problemas de zona horaria
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Error convirtiendo fecha para input:', error, date);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };
  
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
  
  // Estados para confirmación de eliminación de pago
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);
  
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

  // 🎯 === FUNCIONES PARA MENÚ CONTEXTUAL MEJORADO ===
  
  const handleActionMenuOpen = (event, payment) => {
    setActionMenuAnchor(event.currentTarget);
    setCurrentPayment(payment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    // No limpiar currentPayment aquí si hay un modal abierto
    if (!receiptManagementOpen) {
      setCurrentPayment(null);
    }
  };

  const handleOpenReceiptManagement = (payment) => {
    setCurrentPayment(payment);
    setReceiptManagementOpen(true);
    setActionMenuAnchor(null); // Solo cerrar el menú, mantener currentPayment
  };

  const handleCloseReceiptManagement = () => {
    setReceiptManagementOpen(false);
    setReceiptDragActive(false);
    // Limpiar currentPayment al cerrar el modal
    setTimeout(() => setCurrentPayment(null), 100);
  };

  // Drag & Drop para el modal de gestión de comprobantes
  const handleReceiptDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(true);
  };

  const handleReceiptDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(false);
  };

  const handleReceiptDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReceiptDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && currentPayment && currentPayment.id) {
      await handleEditReceiptWithFiles(currentPayment, files);
    } else if (!currentPayment) {
      showNotification('Error: No hay pago seleccionado', 'error');
    }
  };

  // Función mejorada para editar comprobante con archivos específicos
  const handleEditReceiptWithFiles = async (payment, files) => {
    try {
      if (!payment || !payment.id) {
        showNotification('Error: Pago no válido', 'error');
        return;
      }

      setUploadingFile(true);
      console.log('📤 Reemplazando comprobantes con archivos:', files.map(f => f.name));
      console.log('💾 Datos del pago actual:', {
        id: payment.id,
        attachments: payment.attachments,
        receiptUrls: payment.receiptUrls,
        receiptUrl: payment.receiptUrl
      });

      // 1. Eliminar archivos antiguos del Storage
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      console.log('🗑️ Eliminando archivos antiguos:', receiptUrls);
      
      for (const url of receiptUrls) {
        if (url) {
          try {
            let filePath = null;
            
            // Intentar extraer el path de diferentes formatos de URL de Firebase Storage
            if (url.includes('firebasestorage.googleapis.com')) {
              // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Ffile?alt=media&token=...
              const pathMatch = url.match(/\/o\/(.+?)\?/);
              if (pathMatch) {
                filePath = decodeURIComponent(pathMatch[1]);
              }
            } else if (url.includes('storage.googleapis.com')) {
              // Formato: https://storage.googleapis.com/bucket/path/file
              const urlParts = new URL(url);
              const pathParts = urlParts.pathname.split('/').slice(2); // Eliminar '' y bucket
              if (pathParts.length > 0) {
                filePath = pathParts.join('/');
              }
            }
            
            if (filePath) {
              console.log('🔥 Eliminando archivo con path:', filePath);
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
              console.log('✅ Archivo antiguo eliminado exitosamente');
            } else {
              console.warn('⚠️ No se pudo extraer el path del archivo:', url);
            }
          } catch (deleteError) {
            console.warn('⚠️ Error al eliminar archivo antiguo:', deleteError.message);
            // Continuar con el siguiente archivo aunque falle la eliminación
          }
        }
      }

      // 2. Procesar y subir archivos (combinar múltiples archivos en un PDF)
      let filesToUpload = [];
      const timestamp = Date.now();
      
      // Si hay múltiples archivos, combinarlos en un PDF único
      if (files.length > 1) {
        console.log('📄 Combinando múltiples archivos en un PDF único...');
        showNotification('Combinando archivos en PDF único...', 'info');
        
        try {
          const combinedBlob = await combineFilesToPdf(files);
          const combinedFile = new File([combinedBlob], `comprobante_${payment.id}_${timestamp}.pdf`, {
            type: 'application/pdf'
          });
          filesToUpload = [combinedFile];
          console.log('✅ Archivos combinados exitosamente en PDF único');
        } catch (combineError) {
          console.error('❌ Error combinando archivos:', combineError);
          showNotification('Error combinando archivos. Subiendo archivos por separado...', 'warning');
          filesToUpload = files; // Fallback: subir archivos individuales
        }
      } else {
        // Un solo archivo
        filesToUpload = files;
      }
      
      // Subir archivos procesados
      const newReceiptUrls = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        // Generar nombre único para evitar conflictos
        const fileExtension = file.name.split('.').pop();
        const fileName = files.length > 1 && filesToUpload.length === 1
          ? `payments/comprobante_${payment.id}_${timestamp}.pdf`
          : `payments/${payment.id}_${timestamp}_${i + 1}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        console.log('⬆️ Subiendo archivo:', fileName, 'Tamaño:', file.size, 'bytes');
        
        try {
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
          console.log('✅ Archivo subido exitosamente:', downloadURL);
        } catch (uploadError) {
          console.error('❌ Error subiendo archivo:', fileName, uploadError);
          throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
        }
      }
      
      console.log('📋 URLs de nuevos comprobantes:', newReceiptUrls);

      // 3. Actualizar documento en Firestore
      const paymentRef = doc(db, 'payments', payment.id);
      const updateData = {
        attachments: newReceiptUrls, // Campo principal
        receiptUrls: newReceiptUrls, // Para compatibilidad
        receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad con código legacy
        updatedAt: new Date()
      };
      
      console.log('🔄 Actualizando Firestore con datos:', updateData);
      await updateDoc(paymentRef, updateData);
      console.log('✅ Documento actualizado en Firestore exitosamente');

      // Actualizar el estado local del currentPayment para reflejar los cambios inmediatamente
      setCurrentPayment(prevPayment => ({
        ...prevPayment,
        ...updateData,
        id: payment.id
      }));

      console.log('✅ Comprobantes reemplazados exitosamente');
      showNotification('Comprobantes reemplazados exitosamente', 'success');
      
      // Cerrar el modal después de un breve delay para permitir que el usuario vea el éxito
      setTimeout(() => {
        handleCloseReceiptManagement();
      }, 1000);
    } catch (error) {
      console.error('❌ Error al reemplazar comprobantes:', error);
      showNotification(`Error al reemplazar comprobantes: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
    }
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
      date: formatDateForInput(payment.date)
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
        date: createLocalDate(editFormData.date),
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

  // Función para eliminar un pago completo
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    setDeletingPayment(true);
    
    try {
      console.log('🗑️ Iniciando eliminación del pago:', paymentToDelete.id);
      
      // 1. Eliminar comprobantes de Firebase Storage si existen
      if (paymentToDelete.attachments && paymentToDelete.attachments.length > 0) {
        console.log('📎 Eliminando comprobantes del storage...');
        for (const attachmentUrl of paymentToDelete.attachments) {
          try {
            const storageRef = ref(storage, attachmentUrl);
            await deleteObject(storageRef);
            console.log('✅ Comprobante eliminado del storage');
          } catch (storageError) {
            console.warn('⚠️ Error eliminando comprobante del storage:', storageError.message);
            // Continuar aunque falle eliminar el archivo
          }
        }
      }
      
      // 2. Eliminar el documento del pago de Firestore
      const paymentRef = doc(db, 'payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      
      console.log('✅ Pago eliminado exitosamente');
      showNotification('Pago eliminado exitosamente', 'success');
      
      // 3. Cerrar modal y limpiar estado
      setDeletePaymentDialogOpen(false);
      setPaymentToDelete(null);
      handleCloseEditPayment();
      
    } catch (error) {
      console.error('❌ Error al eliminar pago:', error);
      showNotification(`Error al eliminar pago: ${error.message}`, 'error');
    } finally {
      setDeletingPayment(false);
    }
  };

  // Función para abrir diálogo de confirmación de eliminación
  const handleOpenDeletePayment = (payment) => {
    setPaymentToDelete(payment || editingPayment);
    setDeletePaymentDialogOpen(true);
  };

  // Función para cerrar diálogo de eliminación
  const handleCloseDeletePayment = () => {
    setDeletePaymentDialogOpen(false);
    setPaymentToDelete(null);
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
            <Box sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: 1,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}>
              {/* Header de la tabla - Estilo Commitments */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                gap: 2,
                p: 3,
                backgroundColor: 'background.paper',
                borderRadius: '1px 1px 0 0',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
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
                      justifyContent: column === 'MONTO' ? 'center' : 
                                    column === 'ACCIONES' ? 'center' : 'flex-start'
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'text.primary',
                        letterSpacing: '0.8px',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        opacity: 0.85
                      }}
                    >
                      {column}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Cards en formato grid - Estilo Commitments */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                backgroundColor: 'background.paper',
                borderRadius: '0 0 1px 1px',
                borderTop: 'none'
              }}>
                {paginatedPayments.length > 0 ? paginatedPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.01)',
                      transition: { duration: 0.25 }
                    }}
                  >
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                      gap: 2,
                      p: 2.5,
                      borderBottom: index === paginatedPayments.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)'
                      },
                      alignItems: 'center'
                    }}>
                    {/* Estado - Estilo Commitments */}
                    <Box>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={getStatusText(payment.status)}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '20px',
                          borderColor: getStatusColor(payment.status) === 'success' ? theme.palette.success.main :
                                      getStatusColor(payment.status) === 'warning' ? theme.palette.warning.main :
                                      getStatusColor(payment.status) === 'error' ? theme.palette.error.main :
                                      theme.palette.primary.main,
                          color: getStatusColor(payment.status) === 'success' ? theme.palette.success.main :
                                 getStatusColor(payment.status) === 'warning' ? theme.palette.warning.main :
                                 getStatusColor(payment.status) === 'error' ? theme.palette.error.main :
                                 theme.palette.primary.main,
                          backgroundColor: 'transparent !important',
                          '&.MuiChip-root': {
                            backgroundColor: 'transparent !important'
                          },
                          '& .MuiChip-icon': { fontSize: 14 },
                          '& .MuiChip-label': { 
                            px: 1,
                            lineHeight: 1.2
                          }
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
                          fontSize: '0.875rem',
                          lineHeight: 1.3
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
                            lineHeight: 1.2,
                            fontWeight: 400
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
                          bgcolor: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {(payment.companyName || 'SC').charAt(0)}
                      </Avatar>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          lineHeight: 1.3
                        }}
                      >
                        {payment.companyName || 'Sin empresa'}
                      </Typography>
                    </Box>

                    {/* Monto - Estilo Commitments */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        color: 'text.primary',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '0.875rem',
                        lineHeight: 1.2,
                        letterSpacing: 0
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
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: 0.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '& .MuiChip-label': { 
                            px: 1,
                            lineHeight: 1.2
                          }
                        }} 
                      />
                    </Box>

                    {/* Fecha */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.3
                      }}>
                        {formatPaymentDate(payment.date)}
                      </Typography>
                    </Box>

                    {/* Referencia */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace', 
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        lineHeight: 1.3
                      }}>
                        {payment.reference || '-'}
                      </Typography>
                    </Box>

                    {/* ACCIONES MEJORADAS - Menú Contextual */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      justifyContent: 'center'
                    }}>
                      {/* Botón principal de ver comprobante - siempre visible si hay attachments */}
                      {(payment.attachments?.length > 0) && (
                        <Tooltip title="Ver comprobante" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleViewReceipt(payment)}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* Menú contextual para más acciones */}
                      <Tooltip title="Más opciones" arrow>
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionMenuOpen(event, payment)}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.text.primary, 0.08),
                              color: 'text.primary'
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    </Box>
                  </motion.div>
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
            </Box>
          </motion.div>
                
          {/* PAGINACIÓN SEPARADA ESTILO COMMITMENTS */}
          {filteredPayments.length > 0 && (
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

                {/* Salto directo a página - Solo si hay más de 1 página */}
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
                    count={Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage))}
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
            borderRadius: 2,
            background: theme.palette.background.paper,
            minHeight: '70vh',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: theme.palette.text.primary,
          background: theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2
        }}>
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
            width: 32,
            height: 32
          }}>
            <EditIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Editar Pago
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {editingPayment?.companyName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 0, background: theme.palette.background.paper }}>
          <Grid container spacing={3}>
            {/* Columna Izquierda - Información del Pago */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                mb: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📊 Datos del Pago
              </Typography>
              
              <Stack spacing={2.5}>
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
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper
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
                      borderRadius: 1,
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
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper
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
                      helperText="Monto base del compromiso"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper
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
                        helperText="Intereses por derechos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
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
                        helperText="Gastos administrativos"
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
                            color: theme.palette.text.secondary, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto final que se pagó efectivamente"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.primary.main}`
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
                          <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto base del compromiso"
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
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                mb: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📎 Comprobantes de Pago
              </Typography>

              {/* Área de carga de comprobantes */}
              <Paper
                elevation={0}
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  background: theme.palette.background.paper,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                  }
                }}
                onClick={() => document.getElementById('receipt-upload-edit').click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <UploadIcon sx={{ 
                  fontSize: 48, 
                  color: theme.palette.text.secondary,
                  mb: 2
                }} />
                
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  mb: 1
                }}>
                  {dragActive ? 'Suelta los archivos aquí' : 'Subir Comprobantes'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Arrastra archivos aquí o haz clic para seleccionar
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  PDF, JPG, PNG • Máximo 10MB por archivo
                </Typography>
                
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

        <DialogActions sx={{ 
          p: 3, 
          pt: 2, 
          gap: 2,
          background: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Botón de eliminar pago - Lado izquierdo */}
          <Button
            onClick={() => handleOpenDeletePayment(editingPayment)}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ 
              borderRadius: 1,
              px: 3,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08)
              }
            }}
          >
            Eliminar Pago
          </Button>

          {/* Botones de cancelar y guardar - Lado derecho */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleCloseEditPayment}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{ 
                borderRadius: 1,
                px: 3,
                fontWeight: 600
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
                borderRadius: 1,
                px: 3,
                fontWeight: 600
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

      {/* Diálogo de confirmación de eliminación de pago */}
      <Dialog
        open={deletePaymentDialogOpen}
        onClose={handleCloseDeletePayment}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
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
            ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
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
            Se eliminará el registro del pago y todos sus comprobantes asociados.
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

      {/* 🎯 MENÚ CONTEXTUAL MEJORADO */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }
        }}
        TransitionComponent={Fade}
      >
        {/* Ver comprobante - solo si existe */}
        {currentPayment?.attachments?.length > 0 && (
          <ListItemButton onClick={() => {
            handleViewReceipt(currentPayment);
            handleActionMenuClose();
          }}>
            <ListItemIcon>
              <Visibility sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Ver comprobante"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}

        {/* Editar datos del pago */}
        <ListItemButton onClick={() => {
          handleEditPayment(currentPayment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Edit sx={{ color: 'info.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Editar pago"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Gestión de comprobantes - solo si existe */}
        {currentPayment?.attachments?.length > 0 && (
          <>
            <Divider sx={{ my: 0.5 }} />
            
            <ListItemButton onClick={() => handleOpenReceiptManagement(currentPayment)}>
              <ListItemIcon>
                <SwapIcon sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Gestionar comprobantes"
                secondary="Reemplazar o eliminar"
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </>
        )}
      </Menu>

      {/* 📄 MODAL DE GESTIÓN DE COMPROBANTES MEJORADO */}
      <Dialog
        open={receiptManagementOpen}
        onClose={handleCloseReceiptManagement}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ 
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <AttachEmailIcon />
            <Typography variant="h6" fontWeight="600">
              Gestionar Comprobantes
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {currentPayment?.concept || 'Pago seleccionado'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Comprobantes actuales */}
          {currentPayment?.attachments?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                📎 Comprobantes actuales
              </Typography>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}>
                <Typography variant="body2" color="success.dark">
                  ✅ {currentPayment.attachments.length} archivo(s) adjunto(s)
                </Typography>
              </Box>
            </Box>
          )}

          {/* Zona de drag & drop mejorada */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              🔄 Reemplazar comprobantes
            </Typography>
            <Box
              onDragEnter={handleReceiptDragEnter}
              onDragLeave={handleReceiptDragLeave}
              onDragOver={handleReceiptDragOver}
              onDrop={handleReceiptDrop}
              sx={{
                border: `2px dashed ${receiptDragActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: receiptDragActive 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.05)
                }
              }}
              onClick={() => {
                if (!currentPayment || !currentPayment.id) {
                  showNotification('Error: No hay pago seleccionado para reemplazar comprobantes', 'error');
                  return;
                }
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0 && currentPayment && currentPayment.id) {
                    handleEditReceiptWithFiles(currentPayment, files);
                  }
                };
                input.click();
              }}
            >
              <CloudUpload sx={{ 
                fontSize: 48, 
                color: receiptDragActive ? 'primary.main' : 'primary.light',
                mb: 1 
              }} />
              <Typography variant="h6" color="primary.main" fontWeight="600">
                {receiptDragActive ? 'Suelta los archivos aquí' : 'Subir nuevos comprobantes'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Arrastra archivos aquí o haz clic para seleccionar
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Formatos: PDF, JPG, PNG | Múltiples archivos permitidos
              </Typography>
            </Box>
          </Box>

          {/* Loading indicator */}
          {uploadingFile && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                Procesando archivos...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => {
              if (window.confirm('¿Estás seguro de eliminar todos los comprobantes? Esta acción no se puede deshacer.')) {
                handleDeleteReceipt(currentPayment);
                handleCloseReceiptManagement();
              }
            }}
            disabled={uploadingFile}
            startIcon={<Delete />}
            sx={{ 
              color: 'error.main',
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
            }}
          >
            Eliminar todos
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleCloseReceiptManagement} disabled={uploadingFile}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
