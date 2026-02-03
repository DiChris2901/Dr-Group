import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  IconButton,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  FolderZip as ZipIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Flag as FlagIcon,
  FileDownload as FileDownloadIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useProgressLogs } from '../../hooks/useProgressLogs';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DocumentPreviewModal from '../common/DocumentPreviewModal';
import ZipFileViewer from './ZipFileViewer';
import ExcelJS from 'exceljs';

/**
 * TaskProgressDialog - Sistema de bitácora/log de avances con evidencias
 * Tab 1: Nuevo Registro (slider + comentario + archivos)
 * Tab 2: Histórico (lista de registros con editar/eliminar)
 */
const TaskProgressDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { logs, loading: logsLoading, createLog, updateLog, deleteLog, uploadFiles } = useProgressLogs(task?.id, 'delegated_tasks');
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState('');
  const [comentario, setComentario] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [zipViewerOpen, setZipViewerOpen] = useState(false);
  const [selectedZipUrl, setSelectedZipUrl] = useState('');
  const [selectedZipName, setSelectedZipName] = useState('');
  const fileInputRef = useRef(null);

  // Estados disponibles con porcentajes automáticos
  const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente', color: theme.palette.grey[500], porcentaje: 0 },
    { value: 'en_progreso', label: 'En Progreso', color: theme.palette.primary.main, porcentaje: 50 },
    { value: 'pausada', label: 'Pausada', color: theme.palette.warning.main, porcentaje: null },
    { value: 'en_revision', label: 'En Revisión', color: theme.palette.secondary.main, porcentaje: 90 },
    { value: 'completada', label: 'Completada', color: theme.palette.success.main, porcentaje: 100 },
    { value: 'cancelada', label: 'Cancelada', color: theme.palette.error.main, porcentaje: null }
  ];

  // Función para determinar qué estados están permitidos según el estado actual
  const getEstadosPermitidos = (estadoActual) => {
    const reglas = {
      'pendiente': ['pendiente', 'en_progreso', 'pausada', 'cancelada'],
      'en_progreso': ['en_progreso', 'en_revision', 'completada', 'pausada', 'cancelada'],
      'pausada': ['pausada', 'en_progreso', 'cancelada'],
      'en_revision': ['en_revision', 'completada', 'en_progreso', 'cancelada'],
      'completada': ['completada'], // Estado terminal
      'cancelada': ['cancelada'] // Estado terminal
    };
    
    return reglas[estadoActual] || ESTADOS.map(e => e.value);
  };

  // Verificar si un estado está permitido
  const isEstadoPermitido = (estadoValue) => {
    const estadoActualTarea = task?.estado || 'pendiente';
    const estadosPermitidos = getEstadosPermitidos(estadoActualTarea);
    return estadosPermitidos.includes(estadoValue);
  };

  // Obtener mensaje de por qué un estado está bloqueado
  const getMensajeBloqueo = (estadoValue) => {
    const estadoActualTarea = task?.estado || 'pendiente';
    
    if (estadoActualTarea === 'completada') {
      return 'La tarea ya está completada (estado terminal)';
    }
    if (estadoActualTarea === 'cancelada') {
      return 'La tarea está cancelada (estado terminal)';
    }
    
    const mensajes = {
      'pendiente': 'No puedes retroceder a Pendiente una vez iniciada',
      'pausada': 'Desde revisión no puedes pausar, solo completar o corregir',
      'en_revision': 'Para revisar, la tarea debe estar en progreso primero'
    };
    
    return mensajes[estadoValue] || 'Este estado no está disponible en el flujo actual';
  };

  // Calcular porcentaje automáticamente basado en el estado
  const getPorcentajeFromEstado = (estadoSeleccionado) => {
    const estadoObj = ESTADOS.find(e => e.value === estadoSeleccionado);
    if (!estadoObj) return 0;
    
    // Si el estado no tiene porcentaje definido (pausada/cancelada), mantener el último
    if (estadoObj.porcentaje === null) {
      return task?.porcentajeCompletado || 0;
    }
    
    return estadoObj.porcentaje;
  };

  // Porcentaje calculado automáticamente
  const porcentajeCalculado = getPorcentajeFromEstado(estado);

  // Validar roles
  const isCreator = task?.creadoPor?.uid === currentUser?.uid;
  const isAssigned = task?.asignadoA?.uid === currentUser?.uid;
  
  // Permisos: solo el asignado puede crear/editar/eliminar
  const canModify = isAssigned;

      useEffect(() => {
    if (task && open) {
      setEstado(task.estado || 'pendiente');
      setComentario('');
      setSelectedFiles([]);
      setError('');
      setEditingLog(null);
      // Siempre abrir en el primer tab visible (Histórico)
      // Para creador: tab 0 es Histórico
      // Para asignado: tab 0 es Nuevo Registro, tab 1 es Histórico
      // Abrimos en índice 0 para que se vea el contenido inmediatamente
      setTabValue(0);
    }
  }, [task, open, currentUser]);

  // Convertir imágenes a PDF
  const convertImageToPDF = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      return null;
    }

    const pdfDoc = await PDFDocument.create();
    const imageBytes = await file.arrayBuffer();
    
    let image;
    if (fileExtension === 'png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (['jpg', 'jpeg'].includes(fileExtension)) {
      image = await pdfDoc.embedJpg(imageBytes);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    return await pdfDoc.save();
  };

  // Combinar múltiples PDFs
  const combinePDFs = async (pdfBuffers) => {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      try {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (error) {
        console.error('Error al procesar PDF:', error);
        throw new Error('Error al combinar documentos');
      }
    }

    return await mergedPdf.save();
  };

  // Procesar y subir archivos (igual que TaskDialog)
  const processAndUploadFiles = async (files, logId) => {
    if (!files || files.length === 0) return [];

    try {
      console.log(`📄 Procesando ${files.length} archivo(s) para evidencias...`);

      const imageFiles = files.filter(f => ['jpg', 'jpeg', 'png'].includes(f.name.split('.').pop().toLowerCase()));
      const pdfFiles = files.filter(f => f.name.split('.').pop().toLowerCase() === 'pdf');
      const otherFiles = files.filter(f => !['jpg', 'jpeg', 'png', 'pdf'].includes(f.name.split('.').pop().toLowerCase()));

      const uploadedFiles = [];

      // CASO 1: Solo imágenes → Convertir y combinar en PDF
      if (imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0) {
        console.log('🖼️ Convirtiendo imágenes a PDF...');
        const pdfBuffers = [];
        
        for (const file of imageFiles) {
          const pdfBuffer = await convertImageToPDF(file);
          if (pdfBuffer) pdfBuffers.push(pdfBuffer);
        }

        let finalPdfBuffer;
        if (pdfBuffers.length > 1) {
          finalPdfBuffer = await combinePDFs(pdfBuffers);
        } else {
          finalPdfBuffer = pdfBuffers[0];
        }

        const pdfBlob = new Blob([finalPdfBuffer], { type: 'application/pdf' });
        const finalFileName = `evidencias_imagenes_${Date.now()}.pdf`;
        const filePath = `tasks/${task.id}/progress/${logId}/${finalFileName}`;
        const storageRef = ref(storage, filePath);
        
        await uploadBytes(storageRef, pdfBlob);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFiles.push({
          nombre: finalFileName,
          url: downloadURL,
          tipo: 'application/pdf',
          tamaño: pdfBlob.size,
          uploadedAt: new Date().toISOString()
        });
      }
      // CASO 2: PDFs + Imágenes → Combinar todo
      else if ((imageFiles.length > 0 || pdfFiles.length > 0) && otherFiles.length === 0) {
        console.log('📄 Combinando PDFs e imágenes...');
        const pdfBuffers = [];

        for (const file of imageFiles) {
          const pdfBuffer = await convertImageToPDF(file);
          if (pdfBuffer) pdfBuffers.push(pdfBuffer);
        }

        for (const file of pdfFiles) {
          const arrayBuffer = await file.arrayBuffer();
          pdfBuffers.push(arrayBuffer);
        }

        let finalPdfBuffer;
        if (pdfBuffers.length > 1) {
          finalPdfBuffer = await combinePDFs(pdfBuffers);
        } else {
          finalPdfBuffer = pdfBuffers[0];
        }

        const pdfBlob = new Blob([finalPdfBuffer], { type: 'application/pdf' });
        const finalFileName = `evidencias_documentos_${Date.now()}.pdf`;
        const filePath = `tasks/${task.id}/progress/${logId}/${finalFileName}`;
        const storageRef = ref(storage, filePath);
        
        await uploadBytes(storageRef, pdfBlob);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFiles.push({
          nombre: finalFileName,
          url: downloadURL,
          tipo: 'application/pdf',
          tamaño: pdfBlob.size,
          uploadedAt: new Date().toISOString()
        });
      }
      // CASO 3: Un solo archivo de otro tipo
      else if (files.length === 1 && otherFiles.length === 1) {
        const file = otherFiles[0];
        const filePath = `tasks/${task.id}/progress/${logId}/${file.name}`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFiles.push({
          nombre: file.name,
          url: downloadURL,
          tipo: file.type,
          tamaño: file.size,
          uploadedAt: new Date().toISOString()
        });
      }
      // CASO 4: Múltiples archivos mixtos → ZIP
      else {
        console.log('📦 Comprimiendo archivos en ZIP...');
        const zip = new JSZip();
        
        for (const file of files) {
          zip.file(file.name, file);
        }

        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        const finalFileName = `evidencias_archivos_${Date.now()}.zip`;
        const filePath = `tasks/${task.id}/progress/${logId}/${finalFileName}`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, zipBlob);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFiles.push({
          nombre: finalFileName,
          url: downloadURL,
          tipo: 'application/zip',
          tamaño: zipBlob.size,
          uploadedAt: new Date().toISOString()
        });
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error al procesar archivos:', error);
      throw error;
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (tipo) => {
    if (tipo?.includes('pdf')) return <PdfIcon />;
    if (tipo?.includes('image')) return <ImageIcon />;
    if (tipo?.includes('zip')) return <ZipIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async () => {
    if (!comentario.trim()) {
      setError('Debes agregar un comentario');
      return;
    }

    if (!canModify) {
      setError('Solo el asignado puede crear registros');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generar ID temporal para el log
      const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Procesar y subir archivos si hay
      let archivosSubidos = [];
      if (selectedFiles.length > 0) {
        archivosSubidos = await processAndUploadFiles(selectedFiles, logId);
      }

      // Crear el registro de progreso con archivos ya procesados
      const logData = {
        porcentaje: porcentajeCalculado,
        estado,
        comentario: comentario.trim(),
        creadoPor: currentUser.uid,
        creadorNombre: currentUser.displayName || currentUser.email,
        archivos: archivosSubidos
      };

      const result = await createLog(logData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Verificar que la tarea existe antes de actualizarla
      if (!task?.id) {
        throw new Error('ID de tarea no válido');
      }

      const taskRef = doc(db, 'tasks', task.id);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        console.warn('La tarea no existe en Firestore, saltando actualización');
        // Continuar sin error ya que el log se creó correctamente
      } else {
        // Actualizar la tarea principal con el nuevo progreso y estado
        await updateDoc(taskRef, {
          porcentajeCompletado: porcentajeCalculado,
          estado: estado,
          updatedAt: new Date()
        });
      }

      // Resetear formulario
      setEstado('pendiente');
      setComentario('');
      setSelectedFiles([]);
      setTabValue(1); // Cambiar a pestaña de histórico
    } catch (error) {
      console.error('Error al crear registro:', error);
      setError(`Error: ${error.message || 'Intenta nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setEstado(log.estado || 'pendiente');
    setComentario(log.comentario);
    setTabValue(0);
  };

  const handleUpdateLog = async () => {
    if (!comentario.trim()) {
      setError('Debes agregar un comentario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updates = {
        porcentaje: porcentajeCalculado,
        estado,
        comentario: comentario.trim()
      };

      // Si hay nuevos archivos, procesarlos
      if (selectedFiles.length > 0) {
        const archivosSubidos = await processAndUploadFiles(selectedFiles, editingLog.id);
        // Combinar archivos existentes con nuevos
        updates.archivos = [...(editingLog.archivos || []), ...archivosSubidos];
      }

      await updateLog(editingLog.id, updates);

      // Verificar que la tarea existe antes de actualizarla
      if (task?.id) {
        const taskRef = doc(db, 'tasks', task.id);
        const taskSnap = await getDoc(taskRef);
        
        if (taskSnap.exists()) {
          // Actualizar la tarea principal también
          await updateDoc(taskRef, {
            porcentajeCompletado: porcentajeCalculado,
            estado: estado,
            updatedAt: new Date()
          });
        }
      }

      // Resetear
      setEditingLog(null);
      setEstado('pendiente');
      setComentario('');
      setSelectedFiles([]);
      setTabValue(1);
    } catch (error) {
      console.error('Error al actualizar registro:', error);
      setError(`Error: ${error.message || 'Intenta nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm('¿Eliminar este registro de progreso?')) return;

    setLoading(true);
    try {
      await deleteLog(log.id, log.archivos);
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      setError('Error al eliminar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEstado('pendiente');
    setComentario('');
    setSelectedFiles([]);
  };

  const handleOpenPreview = (archivo) => {
    setSelectedDocument(archivo);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedDocument(null);
  };

  // Función de exportación a Excel
  const handleExportarExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bitácora de Progreso', {
        views: [{ state: 'frozen', ySplit: 7 }]  // Freeze en fila 7
      });

      // COLORES CORPORATIVOS - FORMATO PYTHON PROFESIONAL
      const BRAND_COLORS = {
        titleBg: '0B3040',        // Azul oscuro corporativo
        subtitleBg: '1A5F7A',     // Azul medio
        metricsBg: '334155',      // Gris azulado
        dateBg: '475569',         // Gris oscuro
        headerBg: '0B3040',       // Headers de columnas
        white: 'FFFFFF',          // Texto sobre fondos oscuros
        textDark: '223344',       // Texto de contenido
        borderLight: 'E2E8F0',    // Bordes sutiles
        borderMedium: 'C0CCDA',   // Bordes medios
        borderDark: '94A3B8'      // Bordes acentuados
      };

      const totalColumns = 5;

      // FILA 1: Título Principal
      worksheet.mergeCells(1, 1, 1, totalColumns);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = 'DR GROUP';
      titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.titleBg}` } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 30;

      // FILA 2: Subtítulo Descriptivo
      worksheet.mergeCells(2, 1, 2, totalColumns);
      const subtitleCell = worksheet.getCell(2, 1);
      subtitleCell.value = `Bitácora de Progreso - ${task.titulo}`;
      subtitleCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subtitleBg}` } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      worksheet.getRow(2).height = 22;

      // FILA 3: Métricas Consolidadas
      worksheet.mergeCells(3, 1, 3, totalColumns);
      const metricsCell = worksheet.getCell(3, 1);
      const registrosCount = logs.length;
      const estadoActual = ESTADOS.find(e => e.value === task.estadoActual)?.label || 'Sin estado';
      const avance = task.porcentajeCompletado || 0;
      metricsCell.value = `Registros: ${registrosCount} | Estado: ${estadoActual} | Avance: ${avance}% | Prioridad: ${task.prioridad?.toUpperCase() || 'N/A'}`;
      metricsCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      metricsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.metricsBg}` } };
      metricsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      worksheet.getRow(3).height = 22;

      // FILA 4: Fecha de Generación
      worksheet.mergeCells(4, 1, 4, totalColumns);
      const dateCell = worksheet.getCell(4, 1);
      dateCell.value = `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`;
      dateCell.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: `FF${BRAND_COLORS.white}` } };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.dateBg}` } };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(4).height = 18;

      // FILA 5: Espaciador pequeño
      worksheet.getRow(5).height = 5;

      // FILA 6: Espaciador mediano
      worksheet.getRow(6).height = 8;

      // FILA 7: Headers de Columnas
      const headers = ['Fecha', 'Estado', 'Progreso', 'Comentario', 'Archivos'];
      const headerRow = worksheet.getRow(7);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.headerBg}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FF666666' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });
      headerRow.height = 28;

      // FILAS 8+: Datos de los logs
      logs.forEach((log, index) => {
        const rowNum = 8 + index;
        const row = worksheet.getRow(rowNum);

        // Fecha
        row.getCell(1).value = log.fecha ? format(log.fecha.toDate(), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A';
        
        // Estado
        const estadoLabel = ESTADOS.find(e => e.value === log.estado)?.label || log.estado;
        row.getCell(2).value = estadoLabel;
        
        // Progreso
        row.getCell(3).value = `${log.porcentaje || 0}%`;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Comentario
        row.getCell(4).value = log.comentario || 'Sin comentarios';
        
        // Archivos
        const archivosCount = log.archivos?.length || 0;
        row.getCell(5).value = archivosCount > 0 ? `${archivosCount} archivo(s)` : 'Sin archivos';
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

        // Estilo de las celdas
        [1, 2, 3, 4, 5].forEach(colNum => {
          const cell = row.getCell(colNum);
          cell.font = { name: 'Segoe UI', size: 9, color: { argb: `FF${BRAND_COLORS.textDark}` } };
          cell.alignment = { vertical: 'middle', horizontal: colNum === 4 ? 'left' : 'center', wrapText: false };
          cell.border = {
            top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
            left: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } },
            bottom: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderMedium}` } },
            right: { style: 'thin', color: { argb: `FF${BRAND_COLORS.borderLight}` } }
          };
        });

        row.height = 18;
      });

      // Ajustar anchos de columna
      worksheet.getColumn(1).width = 18; // Fecha
      worksheet.getColumn(2).width = 15; // Estado
      worksheet.getColumn(3).width = 12; // Progreso
      worksheet.getColumn(4).width = 55; // Comentario
      worksheet.getColumn(5).width = 18; // Archivos

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Bitacora_${task.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      alert('Error al exportar a Excel. Por favor intenta nuevamente.');
    }
  };

  if (!task) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return theme.palette.error.main;
      case 'alta':
        return theme.palette.warning.main;
      case 'media':
        return theme.palette.info.main;
      case 'baja':
        return theme.palette.grey[400];
      default:
        return theme.palette.grey[300];
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          maxHeight: '90vh',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark'
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            bgcolor: 'primary.main', 
            width: 44,
            height: 44
          }}>
            <TrendingUpIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              mb: 0.5,
              color: 'text.primary',
              fontSize: '1.125rem'
            }}>
              {isCreator ? 'Supervisión de Progreso' : 'Registro de Progreso'}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '0.8125rem',
              display: 'block'
            }}>
              {task?.titulo || 'Documenta avances con evidencias'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Información de la tarea */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2, 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Typography variant="overline" sx={{
            fontWeight: 600,
            color: 'primary.main',
            letterSpacing: 0.8,
            fontSize: '0.75rem',
            display: 'block',
            mb: 2
          }}>
            Información de la Tarea
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <AssignmentIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                  TAREA ASIGNADA
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.4 }}>
                  {task.titulo}
                </Typography>
                {task.descripcion && (
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
                    {task.descripcion}
                  </Typography>
                )}
              </Box>
            </Box>
            <Chip
              icon={<FlagIcon sx={{ fontSize: 14 }} />}
              label={task.prioridad?.toUpperCase()}
              size="small"
              sx={{
                bgcolor: alpha(getPriorityColor(task.prioridad), 0.12),
                color: getPriorityColor(task.prioridad),
                fontWeight: 600,
                fontSize: '0.6875rem',
                height: 24,
                border: `1px solid ${alpha(getPriorityColor(task.prioridad), 0.3)}`
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Tabs - Condicional según rol */}
      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 3, mt: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          {/* Pestaña Nuevo Registro - Solo visible para el asignado */}
          {!isCreator && (
            <Tab 
              icon={<AddIcon />} 
              iconPosition="start" 
              label={editingLog ? "Editar Registro" : "Nuevo Registro"} 
              disabled={!canModify}
            />
          )}
          {/* Pestaña Histórico - Siempre visible */}
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start" 
            label={`Histórico (${logs.length})`} 
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ 
        p: 3,
        pt: 5,
        minHeight: 400
      }}>
        <Box sx={{ mt: 3 }}>
        {/* TAB: Nuevo Registro / Editar - Solo visible para asignado */}
        {!isCreator && tabValue === 0 && (
          <Box>
            {!canModify && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.warning.main, 0.08)
                }}
              >
                <Typography variant="body2" color="warning.main" fontWeight={500}>
                  Solo el usuario asignado puede crear o editar registros de progreso.
                </Typography>
              </Paper>
            )}

            {editingLog && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.08)
                }}
              >
                <Typography variant="body2" color="info.main" fontWeight={500}>
                  Editando registro del {editingLog.fecha && format(editingLog.fecha.toDate(), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </Typography>
              </Paper>
            )}

            {/* Control de progreso */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                bgcolor: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Typography variant="overline" sx={{
                fontWeight: 600,
                color: 'primary.main',
                letterSpacing: 0.8,
                fontSize: '0.75rem',
                display: 'block',
                mb: 2
              }}>
                {editingLog ? 'Editar Información del Registro' : 'Crear Nuevo Registro'}
              </Typography>

              {/* Sección de Estado y Progreso */}
              <Box sx={{ mb: 2.5 }}>
                {/* Selector de Estado Compacto */}
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <InputLabel id="estado-label">Estado de la Tarea *</InputLabel>
                  <Select
                    labelId="estado-label"
                    value={estado}
                    label="Estado de la Tarea *"
                    onChange={(e) => setEstado(e.target.value)}
                    disabled={!canModify}
                    sx={{
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {ESTADOS.map((est) => {
                      const permitido = isEstadoPermitido(est.value);
                      
                      return (
                        <MenuItem 
                          key={est.value} 
                          value={est.value}
                          disabled={!permitido}
                          sx={{ 
                            py: 0.75,
                            fontSize: '0.875rem'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {est.label}
                              {!permitido && ' 🔒'}
                            </Typography>
                            {est.porcentaje !== null && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ({est.porcentaje}%)
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {/* Mensaje informativo compacto */}
                {task?.estado && task.estado !== 'pendiente' && (
                  <Alert
                    severity="info"
                    icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      mb: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      '& .MuiAlert-message': {
                        py: 0,
                        fontSize: '0.75rem'
                      },
                      '& .MuiAlert-icon': {
                        py: 0.5
                      }
                    }}
                  >
                    {task.estado === 'completada' && 'Tarea completada'}
                    {task.estado === 'cancelada' && 'Tarea cancelada'}
                    {task.estado === 'en_progreso' && 'Puedes avanzar, pausar o cancelar'}
                    {task.estado === 'pausada' && 'Reactiva para continuar'}
                    {task.estado === 'en_revision' && 'Completa o regresa a En Progreso'}
                  </Alert>
                )}

                {/* Indicador de progreso minimalista */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.25,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.divider, 0.03),
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      color: 'text.secondary'
                    }}
                  >
                    Progreso
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={porcentajeCalculado}
                        size={28}
                        thickness={4}
                        sx={{
                          color: theme.palette.primary.main
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          component="div" 
                          sx={{ 
                            fontSize: '0.5625rem',
                            fontWeight: 600,
                            color: 'text.primary'
                          }}
                        >
                          {porcentajeCalculado}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Comentario */}
              <TextField
                fullWidth
                label="Comentario *"
                placeholder="Describe el progreso realizado, logros alcanzados..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                multiline
                rows={4}
                required
                disabled={!canModify}
                error={!!error && !comentario.trim()}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />

              {/* Upload archivos */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachFileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        color: 'text.secondary'
                      }}
                    >
                      Evidencias (Opcional)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canModify}
                    sx={{ textTransform: 'none' }}
                  >
                    Agregar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </Box>

                {selectedFiles.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedFiles.map((file, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                          bgcolor: theme.palette.background.paper,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }
                        }}
                      >
                        <Box sx={{ 
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {getFileIcon(file.type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFile(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>

            {error && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.error.main, 0.08)
                }}
              >
                <Typography variant="body2" color="error" fontWeight={500}>
                  {error}
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* TAB: Histórico - Visible para todos */}
        {/* Para creador: tab 0 muestra Histórico (único tab) */}
        {/* Para asignado: tab 1 muestra Histórico */}
        {((isCreator && tabValue === 0) || (!isCreator && tabValue === 1)) && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Typography variant="overline" sx={{
                fontWeight: 600,
                color: 'primary.main',
                letterSpacing: 0.8,
                fontSize: '0.75rem'
              }}>
                Histórico de Registros ({logs.length})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportarExcel}
                disabled={logs.length === 0}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                Exportar Excel
              </Button>
            </Box>

            {logsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : logs.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: theme.palette.background.paper
                }}
              >
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Sin registros aún
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCreator 
                    ? 'El usuario asignado aún no ha registrado avances'
                    : 'Crea el primer registro en la pestaña "Nuevo Registro"'
                  }
                </Typography>
              </Paper>
            ) : (
              /* Grid de tarjetas compactas en 2 columnas */
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                {logs.map((log, index) => {
                  const estadoInfo = ESTADOS.find(e => e.value === log.estado);

                  return (
                    <Paper
                      key={log.id}
                      elevation={0}
                      onClick={() => setSelectedLog(log)}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      {/* Header compacto */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {estadoInfo && (
                            <Chip
                              label={estadoInfo.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: alpha(estadoInfo.color, 0.08),
                                color: estadoInfo.color,
                                border: `1px solid ${alpha(estadoInfo.color, 0.2)}`
                              }}
                            />
                          )}
                          <Chip
                            label={`${log.porcentaje}%`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                            }}
                          />
                        </Box>
                        
                        {/* Indicador de archivos */}
                        {log.archivos && log.archivos.length > 0 && (
                          <Chip
                            icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                            label={log.archivos.length}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: alpha(theme.palette.divider, 0.08)
                            }}
                          />
                        )}
                      </Box>

                      {/* Fecha y usuario */}
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontSize: '0.75rem',
                        display: 'block',
                        mb: 1
                      }}>
                        {log.fecha && format(log.fecha.toDate(), "d MMM yyyy • HH:mm", { locale: es })}
                      </Typography>

                      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                        {log.creadorNombre || 'Usuario'}
                      </Typography>

                      {/* Preview del comentario (2 líneas máximo) */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          fontStyle: 'italic'
                        }}
                      >
                        "{log.comentario}"
                      </Typography>
                    </Paper>
                  );
                })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        gap: 1.5, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : theme.palette.grey[50]
      }}>
        {tabValue === 0 ? (
          <>
            {editingLog && (
              <Button
                onClick={handleCancelEdit}
                variant="outlined"
                disabled={loading}
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Cancelar Edición
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outlined"
              disabled={loading}
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                px: 3
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={editingLog ? handleUpdateLog : handleSubmit}
              variant="contained"
              disabled={loading || !canModify}
              startIcon={loading ? <CircularProgress size={16} /> : <TrendingUpIcon />}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none',
                px: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {loading ? 'Guardando...' : editingLog ? 'Actualizar Registro' : 'Crear Registro'}
            </Button>
          </>
        ) : (
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 1,
              fontWeight: 500,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Modal de Vista Previa de Documentos */}
    <DocumentPreviewModal
      open={previewOpen}
      onClose={handleClosePreview}
      document={selectedDocument}
    />

    {/* Modal de Detalles del Registro */}
    <Dialog
      open={Boolean(selectedLog)}
      onClose={() => setSelectedLog(null)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Detalle del Registro
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedLog?.fecha && format(selectedLog.fecha.toDate(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={() => setSelectedLog(null)} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 4 }}>
        {selectedLog && (
          <Box>
            {/* Usuario y Estado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap', mt: 2 }}>
              <Typography variant="body1" fontWeight={600} color="text.primary">
                {selectedLog.creadorNombre || 'Usuario'}
              </Typography>
              {(() => {
                const estadoInfo = ESTADOS.find(e => e.value === selectedLog.estado);
                return estadoInfo && (
                  <Chip
                    label={estadoInfo.label}
                    size="medium"
                    sx={{
                      height: 28,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      bgcolor: alpha(estadoInfo.color, 0.1),
                      color: estadoInfo.color,
                      border: `1px solid ${alpha(estadoInfo.color, 0.4)}`
                    }}
                  />
                );
              })()}
              <Chip
                label={`Progreso: ${selectedLog.porcentaje}%`}
                size="medium"
                sx={{
                  height: 28,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              />
            </Box>

            {/* Comentario completo */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.divider, 0.03),
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.5)}`
              }}
            >
              <Typography variant="overline" sx={{
                fontWeight: 600,
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.75rem',
                display: 'block',
                mb: 1
              }}>
                Comentario del Registro
              </Typography>
              <Typography 
                variant="body1" 
                color="text.primary" 
                sx={{ 
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedLog.comentario}
              </Typography>
            </Paper>

            {/* Archivos adjuntos */}
            {selectedLog.archivos && selectedLog.archivos.length > 0 && (
              <Box>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.secondary',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem',
                    display: 'block',
                    mb: 2
                  }}
                >
                  📎 Evidencias Adjuntas ({selectedLog.archivos.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {selectedLog.archivos.map((archivo, idx) => (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: theme.palette.background.paper,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {getFileIcon(archivo.tipo)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {archivo.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(archivo.tamaño)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {archivo.tipo === 'application/pdf' && (
                          <Tooltip title="Ver documento" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPreview(archivo)}
                              sx={{ 
                                color: 'primary.main',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {archivo.tipo === 'application/zip' && (
                          <Tooltip title="Ver archivos en ZIP" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedZipUrl(archivo.url);
                                setSelectedZipName(archivo.nombre);
                                setZipViewerOpen(true);
                              }}
                              sx={{ 
                                color: '#ff9800',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha('#ff9800', 0.15),
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <FolderOpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Descargar archivo" arrow placement="top">
                          <IconButton
                            size="small"
                            component="a"
                            href={archivo.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              color: 'text.secondary',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        {/* Botones de acción solo si el usuario puede modificar */}
        {(canModify || selectedLog?.creadorUid === currentUser?.uid) && (
          <>
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                handleEditLog(selectedLog);
                setSelectedLog(null);
              }}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              Editar
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => {
                handleDeleteLog(selectedLog);
                setSelectedLog(null);
              }}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                color: 'error.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.08)
                }
              }}
            >
              Eliminar
            </Button>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={() => setSelectedLog(null)}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>

      {/* Modal de visor de archivos ZIP */}
      <ZipFileViewer
        open={zipViewerOpen}
        onClose={() => {
          setZipViewerOpen(false);
          setSelectedZipUrl('');
          setSelectedZipName('');
        }}
        zipUrl={selectedZipUrl}
        zipFileName={selectedZipName}
      />
    </Dialog>
    </>
  );
};

export default TaskProgressDialog;
