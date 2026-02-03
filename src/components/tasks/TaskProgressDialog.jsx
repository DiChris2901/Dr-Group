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
  Tooltip
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
  FileDownload as FileDownloadIcon
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
import ExcelJS from 'exceljs';

/**
 * TaskProgressDialog - Sistema de bitácora/log de avances con evidencias
 * Tab 1: Nuevo Registro (slider + comentario + archivos)
 * Tab 2: Histórico (lista de registros con editar/eliminar)
 */
const TaskProgressDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { logs, loading: logsLoading, createLog, updateLog, deleteLog, uploadFiles } = useProgressLogs(task?.id);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState('');
  const [comentario, setComentario] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const fileInputRef = useRef(null);

  // Estados disponibles con porcentajes automáticos
  const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente', color: theme.palette.grey[500], porcentaje: 0 },
    { value: 'en_progreso', label: 'En Progreso', color: theme.palette.info.main, porcentaje: 50 },
    { value: 'pausada', label: 'Pausada', color: theme.palette.warning.main, porcentaje: null }, // Mantiene el anterior
    { value: 'en_revision', label: 'En Revisión', color: theme.palette.secondary.main, porcentaje: 90 },
    { value: 'completada', label: 'Completada', color: theme.palette.success.main, porcentaje: 100 },
    { value: 'cancelada', label: 'Cancelada', color: theme.palette.error.main, porcentaje: null } // Mantiene el anterior
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

  useEffect(() => {
    if (task && open) {
      setEstado(task.estado || 'pendiente');
      setComentario('');
      setSelectedFiles([]);
      setError('');
      setEditingLog(null);
      setTabValue(0);
    }
  }, [task, open]);

  // Validar permisos: solo el asignado puede crear/editar/eliminar
  const canModify = task?.asignadoA?.uid === currentUser?.uid;

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
      const worksheet = workbook.addWorksheet('Bitácora de Progreso');

      // Colores del tema (DR Group branding)
      const BRAND_COLORS = {
        primary: 'FF667EEA',
        secondary: 'FF764BA2',
        accent: 'FFF093FB',
        success: 'FF4CAF50',
        text: 'FF2C3E50'
      };

      // FILA 1: Logo/Empresa (Merge A1:E1)
      worksheet.mergeCells('A1:E1');
      const logoCell = worksheet.getCell('A1');
      logoCell.value = '🏢 DR GROUP - Sistema de Bitácora Profesional';
      logoCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      logoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BRAND_COLORS.primary }
      };
      logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 35;

      // FILA 2: Título del Reporte
      worksheet.mergeCells('A2:E2');
      const titleCell = worksheet.getCell('A2');
      titleCell.value = `Bitácora de Progreso - ${task.titulo}`;
      titleCell.font = { size: 14, bold: true, color: { argb: BRAND_COLORS.text } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 25;

      // FILA 3: Información de la Tarea
      worksheet.mergeCells('A3:B3');
      worksheet.getCell('A3').value = 'Tarea:';
      worksheet.getCell('A3').font = { bold: true };
      worksheet.mergeCells('C3:E3');
      worksheet.getCell('C3').value = task.titulo;

      // FILA 4: Descripción
      worksheet.mergeCells('A4:B4');
      worksheet.getCell('A4').value = 'Descripción:';
      worksheet.getCell('A4').font = { bold: true };
      worksheet.mergeCells('C4:E4');
      worksheet.getCell('C4').value = task.descripcion || 'N/A';

      // FILA 5: Prioridad y Porcentaje
      worksheet.getCell('A5').value = 'Prioridad:';
      worksheet.getCell('A5').font = { bold: true };
      worksheet.getCell('B5').value = task.prioridad?.toUpperCase() || 'N/A';
      worksheet.getCell('D5').value = 'Avance:';
      worksheet.getCell('D5').font = { bold: true };
      worksheet.getCell('E5').value = `${task.porcentajeCompletado || 0}%`;

      // FILA 6: Fecha de Exportación
      worksheet.mergeCells('A6:E6');
      worksheet.getCell('A6').value = `Exportado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}`;
      worksheet.getCell('A6').font = { italic: true, color: { argb: 'FF666666' } };
      worksheet.getCell('A6').alignment = { horizontal: 'right' };

      // FILA 7: Espacio en blanco
      worksheet.getRow(7).height = 10;

      // FILA 8: Encabezados de la tabla
      const headers = ['Fecha', 'Estado', 'Progreso', 'Comentario', 'Archivos'];
      const headerRow = worksheet.getRow(8);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: BRAND_COLORS.secondary }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      headerRow.height = 25;

      // Datos de los logs
      logs.forEach((log, index) => {
        const rowNum = 9 + index;
        const row = worksheet.getRow(rowNum);

        // Fecha
        row.getCell(1).value = log.fecha ? format(log.fecha.toDate(), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A';
        
        // Estado
        const estadoLabel = ESTADOS.find(e => e.value === log.estadoActual)?.label || log.estadoActual;
        row.getCell(2).value = estadoLabel;
        
        // Progreso
        row.getCell(3).value = `${log.porcentaje || 0}%`;
        row.getCell(3).alignment = { horizontal: 'center' };
        
        // Comentario
        row.getCell(4).value = log.comentario || 'Sin comentarios';
        
        // Archivos
        const archivosCount = log.archivos?.length || 0;
        row.getCell(5).value = archivosCount > 0 ? `${archivosCount} archivo(s)` : 'Sin archivos';
        row.getCell(5).alignment = { horizontal: 'center' };

        // Estilo de filas alternadas
        if (index % 2 === 0) {
          [1, 2, 3, 4, 5].forEach(colNum => {
            row.getCell(colNum).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }
            };
          });
        }

        // Bordes
        [1, 2, 3, 4, 5].forEach(colNum => {
          row.getCell(colNum).border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });

        row.height = 20;
      });

      // Ajustar anchos de columna
      worksheet.getColumn(1).width = 18; // Fecha
      worksheet.getColumn(2).width = 15; // Estado
      worksheet.getColumn(3).width = 12; // Progreso
      worksheet.getColumn(4).width = 55; // Comentario
      worksheet.getColumn(5).width = 18; // Archivos

      // Freeze panes (filas 1-8 fijas)
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 8 }];

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
              Registro de Progreso
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

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 3, mt: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={<AddIcon />} 
            iconPosition="start" 
            label={editingLog ? "Editar Registro" : "Nuevo Registro"} 
            disabled={!canModify}
          />
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
        {/* TAB 1: Nuevo Registro / Editar */}
        {tabValue === 0 && (
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
              {/* Selector de Estado PRIMERO */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="estado-label">Estado de la Tarea *</InputLabel>
                <Select
                  labelId="estado-label"
                  value={estado}
                  label="Estado de la Tarea *"
                  onChange={(e) => setEstado(e.target.value)}
                  disabled={!canModify}
                  sx={{
                    borderRadius: 1,
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }
                  }}
                >
                  {ESTADOS.map((est) => {
                    const permitido = isEstadoPermitido(est.value);
                    const esActual = est.value === estado;
                    
                    return (
                      <MenuItem 
                        key={est.value} 
                        value={est.value}
                        disabled={!permitido}
                        sx={{
                          opacity: permitido ? 1 : 0.4,
                          cursor: permitido ? 'pointer' : 'not-allowed',
                          '&.Mui-disabled': {
                            opacity: 0.4
                          }
                        }}
                      >
                        <Tooltip 
                          title={!permitido ? getMensajeBloqueo(est.value) : ''} 
                          arrow 
                          placement="left"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: est.color,
                                  opacity: permitido ? 1 : 0.5
                                }} 
                              />
                              <Typography variant="body2" sx={{ color: permitido ? 'inherit' : 'text.disabled' }}>
                                {est.label}
                                {!permitido && ' 🔒'}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="caption" 
                              color={permitido ? 'text.secondary' : 'text.disabled'} 
                              sx={{ fontWeight: 600 }}
                            >
                              {est.porcentaje !== null ? `${est.porcentaje}%` : 'Mantiene anterior'}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Mensaje informativo sobre flujo de estados */}
              {task?.estado && task.estado !== 'pendiente' && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.05)
                  }}
                >
                  <Typography variant="caption" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    {task.estado === 'completada' && 'Tarea completada - No se pueden hacer cambios de estado'}
                    {task.estado === 'cancelada' && 'Tarea cancelada - No se pueden hacer cambios de estado'}
                    {task.estado === 'en_progreso' && 'Puedes avanzar a Revisión/Completada, o pausar/cancelar si es necesario'}
                    {task.estado === 'pausada' && 'Reactiva la tarea para continuar en progreso'}
                    {task.estado === 'en_revision' && 'Completa la revisión o regresa a En Progreso si hay correcciones'}
                  </Typography>
                </Paper>
              )}

              {/* Porcentaje calculado automáticamente (solo display) */}
              <Box sx={{ 
                p: 2.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Progreso Calculado
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'baseline',
                  gap: 0.5
                }}>
                  <Typography variant="h3" fontWeight={600} color="success.main">
                    {porcentajeCalculado}
                  </Typography>
                  <Typography variant="h5" fontWeight={500} color="success.main">
                    %
                  </Typography>
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

        {/* TAB 2: Histórico */}
        {tabValue === 1 && (
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
                  Crea el primer registro en la pestaña "Nuevo Registro"
                </Typography>
              </Paper>
            ) : (
              /* ===== TIMELINE VISUAL ===== */
              <Box sx={{ position: 'relative', pl: 4 }}>
                {/* Línea vertical conectora */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 20,
                    top: 30,
                    bottom: 30,
                    width: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 2
                  }}
                />

                {logs.map((log, index) => {
                  const estadoInfo = ESTADOS.find(e => e.value === log.estado);
                  const isFirst = index === 0;
                  const isLast = index === logs.length - 1;

                  return (
                    <Box key={log.id} sx={{ position: 'relative', mb: isLast ? 0 : 4 }}>
                      {/* Marcador circular en la línea de tiempo */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: -30,
                          top: 12,
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: estadoInfo?.color || theme.palette.primary.main,
                          border: `4px solid ${theme.palette.background.paper}`,
                          boxShadow: `0 0 0 3px ${alpha(estadoInfo?.color || theme.palette.primary.main, 0.2)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          zIndex: 2
                        }}
                      >
                        {log.porcentaje}%
                      </Box>

                      {/* Card del registro */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          border: `1px solid ${alpha(estadoInfo?.color || theme.palette.primary.main, 0.3)}`,
                          bgcolor: theme.palette.background.paper,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        {/* Header del registro */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {log.creadorNombre || 'Usuario'}
                              </Typography>
                              {estadoInfo && (
                                <Chip
                                  label={estadoInfo.label}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: alpha(estadoInfo.color, 0.15),
                                    color: estadoInfo.color,
                                    border: `1px solid ${estadoInfo.color}`,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <HistoryIcon sx={{ fontSize: 14 }} />
                              {log.fecha && format(log.fecha.toDate(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </Typography>
                          </Box>

                          {/* Botones de acción */}
                          {canModify && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditLog(log)}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLog(log)}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    color: 'error.main'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>

                        {/* Comentario */}
                        <Typography 
                          variant="body2" 
                          color="text.primary" 
                          sx={{ 
                            lineHeight: 1.7, 
                            mb: log.archivos?.length > 0 ? 2 : 0,
                            pl: 2,
                            borderLeft: `3px solid ${alpha(estadoInfo?.color || theme.palette.primary.main, 0.3)}`,
                            fontStyle: 'italic'
                          }}
                        >
                          "{log.comentario}"
                        </Typography>

                        {/* Archivos adjuntos */}
                        {log.archivos && log.archivos.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                textTransform: 'uppercase',
                                letterSpacing: 0.8,
                                fontWeight: 600,
                                color: 'text.secondary',
                                display: 'block',
                                mb: 1
                              }}
                            >
                              📎 Evidencias ({log.archivos.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {log.archivos.map((archivo, idx) => (
                                <Paper
                                  key={idx}
                                  elevation={0}
                                  sx={{
                                    p: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                    bgcolor: alpha(theme.palette.background.default, 0.5),
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                                      borderColor: theme.palette.primary.main
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
                                    <Typography variant="body2" noWrap fontWeight={600}>
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
                      </Paper>
                    </Box>
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
    </>
  );
};

export default TaskProgressDialog;
