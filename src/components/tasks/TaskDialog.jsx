import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Autocomplete,
  Paper,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useDelegatedTasks } from '../../hooks/useDelegatedTasks';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import DocumentPreviewModal from '../common/DocumentPreviewModal';

/**
 * TaskDialog - Modal para crear/editar tareas delegadas
 * Diseño: Siguiendo MODAL_DESIGN_SYSTEM.md estrictamente
 */
const TaskDialog = ({ open, onClose, task = null }) => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { createTask, updateTask } = useDelegatedTasks();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fechaVencimiento: '',
    empresa: [],
    asignadoA: null
  });

  const [errors, setErrors] = useState({});
  
  // Estado para adjuntos múltiples
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Cargar usuarios disponibles
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            uid: doc.id,
            nombre: userData.name || userData.displayName || userData.email,
            email: userData.email,
            photoURL: userData.photoURL
          });
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const companiesQuery = query(collection(db, 'companies'));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = [];
        companiesSnapshot.forEach((doc) => {
          const companyData = doc.data();
          companiesData.push({
            id: doc.id,
            nombre: companyData.name || companyData.nombre,
            logoURL: companyData.logoURL || companyData.logo || companyData.logoUrl
          });
        });
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (open) {
      fetchUsers();
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    if (task && companies.length > 0) {
      // Encontrar las empresas (puede ser una o múltiples)
      let empresasArray = [];
      if (task.empresa) {
        // Si task.empresa es un array
        if (Array.isArray(task.empresa)) {
          empresasArray = task.empresa.map(emp => {
            if (typeof emp === 'object') {
              return companies.find(c => 
                (emp.id && c.id === emp.id) || 
                (emp.nombre && c.nombre === emp.nombre)
              );
            } else if (typeof emp === 'string') {
              return companies.find(c => c.id === emp || c.nombre === emp);
            }
            return null;
          }).filter(Boolean);
        }
        // Si es un solo objeto o string (retrocompatibilidad)
        else if (typeof task.empresa === 'object') {
          const empresaObj = companies.find(c => 
            (task.empresa.id && c.id === task.empresa.id) || 
            (task.empresa.nombre && c.nombre === task.empresa.nombre)
          );
          if (empresaObj) empresasArray = [empresaObj];
        } else if (typeof task.empresa === 'string') {
          const empresaObj = companies.find(c => 
            c.id === task.empresa || 
            c.nombre === task.empresa
          );
          if (empresaObj) empresasArray = [empresaObj];
        }
      }

      setFormData({
        titulo: task.titulo || '',
        descripcion: task.descripcion || '',
        prioridad: task.prioridad || 'media',
        fechaVencimiento: task.fechaVencimiento 
          ? new Date(task.fechaVencimiento.seconds * 1000).toISOString().split('T')[0] 
          : '',
        empresa: empresasArray,
        asignadoA: task.asignadoA || null
      });
      
      // Cargar adjunto existente si existe
      if (task.adjunto) {
        setExistingAttachment(task.adjunto);
      } else {
        setExistingAttachment(null);
      }
      setSelectedFiles([]);
    } else if (!task) {
      setFormData({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fechaVencimiento: '',
        empresa: [],
        asignadoA: null
      });
      setExistingAttachment(null);
      setSelectedFiles([]);
    }
    setErrors({});
  }, [task, open, companies]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validar tamaño total (máximo 30MB para evitar errores HTTP/2)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 30 * 1024 * 1024; // 30MB
    
    if (totalSize > maxSize) {
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      setErrors({ ...errors, file: `El tamaño total (${sizeMB}MB) supera el límite de 30MB. Por favor, reduce el tamaño de los archivos.` });
      return;
    }

    setSelectedFiles(files);
    setErrors({ ...errors, file: null });
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleOpenPreview = () => {
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleRemoveExistingAttachment = async () => {
    if (!existingAttachment) return;
    
    try {
      // Eliminar de Firebase Storage
      const storageRef = ref(storage, existingAttachment.path);
      await deleteObject(storageRef);
      
      // Actualizar en Firestore
      await updateTask(task.id, { adjunto: null });
      
      setExistingAttachment(null);
    } catch (error) {
      console.error('❌ Error al eliminar adjunto:', error);
      setErrors({ ...errors, file: 'Error al eliminar el adjunto' });
    }
  };

  // Convertir imágenes a PDF usando pdf-lib
  const convertImageToPDF = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Solo convertir imágenes
    if (!['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      return null; // No es imagen o no se puede convertir
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

  // Combinar múltiples PDFs en uno solo
  const combinePDFs = async (pdfBuffers) => {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      try {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (error) {
        console.error('❌ Error al procesar PDF:', error);
        throw new Error('Error al combinar documentos');
      }
    }

    return await mergedPdf.save();
  };

  const uploadFile = async (files) => {
    if (!files || files.length === 0) return null;

    try {
      setUploadingFile(true);
      setProcessingFiles(true);


      // Determinar qué archivos son imágenes y cuáles son otros tipos
      const imageFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png'].includes(ext);
      });

      const pdfFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ext === 'pdf';
      });

      const otherFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return !['jpg', 'jpeg', 'png', 'pdf'].includes(ext);
      });

      // CASO 1: Solo imágenes → Convertir a PDF y combinar
      if (imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0) {
        const pdfBuffers = [];
        
        for (const file of imageFiles) {
          const pdfBuffer = await convertImageToPDF(file);
          if (pdfBuffer) pdfBuffers.push(pdfBuffer);
        }

        setProcessingFiles(false);

        let finalPdfBuffer;
        let finalFileName;

        if (pdfBuffers.length > 1) {
          finalPdfBuffer = await combinePDFs(pdfBuffers);
          finalFileName = `imagenes_combinadas_${Date.now()}.pdf`;
        } else {
          finalPdfBuffer = pdfBuffers[0];
          const originalName = imageFiles[0].name.replace(/\.[^/.]+$/, '');
          finalFileName = `${originalName}_${Date.now()}.pdf`;
        }

        const pdfBlob = new Blob([finalPdfBuffer], { type: 'application/pdf' });
        const pdfSizeMB = pdfBlob.size / (1024 * 1024);
        
        if (pdfBlob.size > 25 * 1024 * 1024) {
          throw new Error(`El PDF de imágenes (${pdfSizeMB.toFixed(2)}MB) es demasiado grande. Límite: 25MB.`);
        }
        
        const timestamp = Date.now();
        const sanitizedFileName = finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `tasks/${currentUser.uid}/${timestamp}_${sanitizedFileName}`;
        const storageRef = ref(storage, filePath);
        

        await uploadBytes(storageRef, pdfBlob, {
          contentType: 'application/pdf'
        });
        const downloadURL = await getDownloadURL(storageRef);


        return {
          nombre: finalFileName,
          url: downloadURL,
          path: filePath,
          tipo: 'application/pdf',
          tamaño: pdfBlob.size,
          fechaSubida: new Date(),
          archivosOriginales: imageFiles.length,
          tipoContenido: 'imagenes_pdf'
        };
      }

      // CASO 2: PDFs + Imágenes → Convertir imágenes y combinar todo
      if ((imageFiles.length > 0 || pdfFiles.length > 0) && otherFiles.length === 0) {
        const pdfBuffers = [];

        // Procesar imágenes
        for (const file of imageFiles) {
          const pdfBuffer = await convertImageToPDF(file);
          if (pdfBuffer) pdfBuffers.push(pdfBuffer);
        }

        // Procesar PDFs existentes
        for (const file of pdfFiles) {
          const arrayBuffer = await file.arrayBuffer();
          pdfBuffers.push(arrayBuffer);
        }

        setProcessingFiles(false);

        let finalPdfBuffer;
        if (pdfBuffers.length > 1) {
          finalPdfBuffer = await combinePDFs(pdfBuffers);
        } else {
          finalPdfBuffer = pdfBuffers[0];
        }

        // Validar tamaño del PDF combinado
        const pdfBlob = new Blob([finalPdfBuffer], { type: 'application/pdf' });
        const pdfSizeMB = pdfBlob.size / (1024 * 1024);
        
        if (pdfBlob.size > 25 * 1024 * 1024) { // 25MB límite
          throw new Error(`El PDF combinado (${pdfSizeMB.toFixed(2)}MB) es demasiado grande. Límite: 25MB. Intenta con menos archivos o archivos más pequeños.`);
        }

        const finalFileName = `documentos_combinados_${Date.now()}.pdf`;
        const timestamp = Date.now();
        const sanitizedFileName = finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `tasks/${currentUser.uid}/${timestamp}_${sanitizedFileName}`;
        const storageRef = ref(storage, filePath);
        

        // Subir con reintentos
        let uploadSuccess = false;
        let retries = 0;
        const maxRetries = 2;
        
        while (!uploadSuccess && retries <= maxRetries) {
          try {
            await uploadBytes(storageRef, pdfBlob, {
              contentType: 'application/pdf',
              customMetadata: {
                'original-files': files.length.toString(),
                'upload-date': new Date().toISOString()
              }
            });
            uploadSuccess = true;
          } catch (uploadError) {
            retries++;
            
            if (retries > maxRetries) {
              throw new Error(`Error al subir archivo después de ${maxRetries + 1} intentos. El archivo puede ser demasiado grande o hay problemas de conexión.`);
            }
            
            // Esperar 1 segundo antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const downloadURL = await getDownloadURL(storageRef);


        return {
          nombre: finalFileName,
          url: downloadURL,
          path: filePath,
          tipo: 'application/pdf',
          tamaño: pdfBlob.size,
          fechaSubida: new Date(),
          archivosOriginales: files.length,
          tipoContenido: 'documentos_pdf'
        };
      }

      // CASO 3: Archivos de Office u otros tipos → Subir archivo único original
      // (No combinar archivos de Office, mantenerlos originales)
      if (files.length === 1) {
        setProcessingFiles(false);
        const file = files[0];
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `tasks/${currentUser.uid}/${timestamp}_${sanitizedFileName}`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);


        return {
          nombre: file.name,
          url: downloadURL,
          path: filePath,
          tipo: file.type,
          tamaño: file.size,
          fechaSubida: new Date(),
          archivosOriginales: 1,
          tipoContenido: 'archivo_original'
        };
      }

      // CASO 4: Múltiples archivos mixtos → Comprimir en ZIP
      setProcessingFiles(false);

      const zip = new JSZip();
      
      // Agregar todos los archivos al ZIP
      for (const file of files) {
        zip.file(file.name, file);
      }

      // Generar el archivo ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const finalFileName = `documentos_${Date.now()}.zip`;
      const timestamp = Date.now();
      const sanitizedFileName = finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `tasks/${currentUser.uid}/${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, zipBlob);
      const downloadURL = await getDownloadURL(storageRef);


      return {
        nombre: finalFileName,
        url: downloadURL,
        path: filePath,
        tipo: 'application/zip',
        tamaño: zipBlob.size,
        fechaSubida: new Date(),
        archivosOriginales: files.length,
        tipoContenido: 'archivos_zip'
      };

    } catch (error) {
      console.error('❌ Error al procesar archivos:', error);
      throw error;
    } finally {
      setUploadingFile(false);
      setProcessingFiles(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.prioridad) {
      newErrors.prioridad = 'La prioridad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let adjuntoData = existingAttachment;

      // Si hay archivos nuevos seleccionados
      if (selectedFiles.length > 0) {
        // Si estamos editando y había un adjunto anterior, eliminarlo
        if (task && existingAttachment) {
          try {
            const oldStorageRef = ref(storage, existingAttachment.path);
            await deleteObject(oldStorageRef);
          } catch (error) {
            console.error('⚠️ Error al eliminar adjunto anterior:', error);
            // Continuar aunque falle la eliminación del adjunto anterior
          }
        }
        
        // Procesar y subir archivos
        adjuntoData = await uploadFile(selectedFiles);
      }

      // Preparar datos para enviar
      const dataToSubmit = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        categoria: 'general',
        // Convertir fecha string a Date object si existe
        fechaVencimiento: formData.fechaVencimiento 
          ? new Date(formData.fechaVencimiento) 
          : null,
        // Guardar el array de empresas (con id, nombre, logoURL)
        empresa: formData.empresa || [],
        // Guardar el objeto completo del usuario asignado (con uid, nombre, email)
        asignadoA: formData.asignadoA || null,
        // Agregar adjunto si existe
        adjunto: adjuntoData || null
      };


      if (task) {
        await updateTask(task.id, dataToSubmit);
      } else {
        const taskId = await createTask(dataToSubmit);
      }
      onClose();
    } catch (error) {
      console.error('❌ Error completo al guardar tarea:', error);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      setErrors({ submit: `Error: ${error.message || 'Error desconocido'}` });
    } finally {
      setLoading(false);
    }
  };

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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      {/* HEADER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            {task ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0,
              color: 'text.primary'
            }}>
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {task ? 'Modificar tarea existente' : 'Crear tarea para asignar'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 5 }}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* INFORMACIÓN PRINCIPAL */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                background: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Typography variant="overline" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem'
                }}>
                  <AssignmentIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Información de la Tarea
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Título */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la Tarea"
                      value={formData.titulo}
                      onChange={(e) => handleChange('titulo', e.target.value)}
                      error={Boolean(errors.titulo)}
                      helperText={errors.titulo}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main
                          }
                        }
                      }}
                    />
                  </Grid>

                  {/* Descripción */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Descripción"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Describe los detalles de la tarea..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>

                  {/* Asignar a Usuario */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={users.filter(user => user.uid !== currentUser?.uid)}
                      loading={loadingUsers}
                      getOptionLabel={(option) => option.nombre}
                      value={formData.asignadoA}
                      onChange={(event, newValue) => handleChange('asignadoA', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Asignar a Usuario"
                          placeholder="Selecciona un usuario..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <PersonIcon sx={{ color: 'text.secondary', ml: 1, mr: -0.5 }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              src={option.photoURL} 
                              sx={{ width: 32, height: 32 }}
                            >
                              {option.nombre.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {option.nombre}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                  </Grid>

                  {/* Prioridad y Fecha */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Prioridad</InputLabel>
                      <Select
                        value={formData.prioridad}
                        onChange={(e) => handleChange('prioridad', e.target.value)}
                        label="Prioridad"
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="baja">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.grey[400]
                              }}
                            />
                            Baja
                          </Box>
                        </MenuItem>
                        <MenuItem value="media">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.info.main
                              }}
                            />
                            Media
                          </Box>
                        </MenuItem>
                        <MenuItem value="alta">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.warning.main
                              }}
                            />
                            Alta
                          </Box>
                        </MenuItem>
                        <MenuItem value="urgente">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: theme.palette.error.main
                              }}
                            />
                            Urgente
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Fecha de Vencimiento */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha de Vencimiento"
                      value={formData.fechaVencimiento}
                      onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>

                  {/* Empresa */}
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={companies}
                      loading={loadingCompanies}
                      getOptionLabel={(option) => option.nombre || ''}
                      value={formData.empresa}
                      onChange={(event, newValue) => handleChange('empresa', newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.nombre}
                              {...tagProps}
                              avatar={
                                option.logoURL ? (
                                  <Avatar 
                                    src={option.logoURL} 
                                    sx={{ 
                                      bgcolor: 'transparent !important',
                                      '& img': {
                                        objectFit: 'contain'
                                      }
                                    }}
                                  />
                                ) : (
                                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                                    <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                  </Avatar>
                                )
                              }
                              sx={{
                                borderRadius: 1,
                                '& .MuiChip-deleteIcon': {
                                  color: alpha(theme.palette.text.primary, 0.6),
                                  '&:hover': {
                                    color: 'error.main'
                                  }
                                }
                              }}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Empresas"
                          placeholder="Selecciona una o más empresas..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                {formData.empresa.length === 0 && (
                                  <BusinessIcon sx={{ color: 'text.secondary', ml: 1, mr: -0.5 }} />
                                )}
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {option.logoURL ? (
                              <Avatar 
                                src={option.logoURL} 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: 'transparent',
                                  '& img': {
                                    objectFit: 'contain'
                                  }
                                }}
                              >
                                {option.nombre.charAt(0).toUpperCase()}
                              </Avatar>
                            ) : (
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main'
                                }}
                              >
                                <BusinessIcon fontSize="small" />
                              </Avatar>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {option.nombre}
                            </Typography>
                          </Box>
                        );
                      }}
                    />
                  </Grid>

                  {/* Adjunto de Archivo */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="overline" sx={{ 
                      fontWeight: 600, 
                      color: 'text.secondary',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem',
                      display: 'block',
                      mb: 2
                    }}>
                      <AttachFileIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Documentos (Imágenes→PDF, Office originales, Mixtos→ZIP)
                    </Typography>

                    {/* Mostrar adjunto existente */}
                    {existingAttachment && selectedFiles.length === 0 && (
                      <Paper sx={{ 
                        p: 2, 
                        mb: 2,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: 'success.main'
                          }}>
                            <FileIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {existingAttachment.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(existingAttachment.tamaño / 1024).toFixed(2)} KB
                              {existingAttachment.archivosOriginales > 1 && ` • ${existingAttachment.archivosOriginales} documentos combinados`}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {/* Botón Vista Previa solo para PDFs e imágenes */}
                          {(existingAttachment.tipo === 'application/pdf' || existingAttachment.tipo?.startsWith('image/')) && (
                            <IconButton
                              size="small"
                              onClick={handleOpenPreview}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                          {/* Botón Descargar para ZIPs y otros archivos */}
                          {(existingAttachment.tipo === 'application/zip' || 
                            (!existingAttachment.tipo?.startsWith('image/') && existingAttachment.tipo !== 'application/pdf')) && (
                            <IconButton
                              size="small"
                              component="a"
                              href={existingAttachment.url}
                              download
                              sx={{ 
                                color: 'secondary.main',
                                '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={handleRemoveExistingAttachment}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    )}

                    {/* Mostrar archivos seleccionados */}
                    {selectedFiles.length > 0 && (
                      <>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {selectedFiles.length} archivo(s) seleccionado(s)
                          </Typography>
                          <Button 
                            size="small" 
                            onClick={handleRemoveAllFiles}
                            sx={{ color: 'error.main' }}
                          >
                            Eliminar todos
                          </Button>
                        </Box>
                        {selectedFiles.map((file, index) => (
                          <Paper 
                            key={index}
                            sx={{ 
                              p: 2, 
                              mb: 1,
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main'
                              }}>
                                <FileIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {(file.size / 1024).toFixed(2)} KB
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveFile(index)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        ))}
                      </>
                    )}

                    {/* Botón para seleccionar archivos */}
                    {selectedFiles.length === 0 && (
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        disabled={processingFiles}
                        sx={{
                          borderRadius: 1,
                          py: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          color: 'text.secondary',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        {existingAttachment ? 'Reemplazar Documentos' : 'Seleccionar Documentos'}
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleFileSelect}
                          accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.zip"
                        />
                      </Button>
                    )}

                    {processingFiles && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="caption" color="text.secondary">
                          Procesando documentos (convirtiendo/comprimiendo)...
                        </Typography>
                      </Box>
                    )}

                    {errors.file && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {errors.file}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                {/* Error de submit */}
                {errors.submit && (
                  <Box sx={{ mt: 3 }}>
                    <Typography color="error" variant="body2">
                      {errors.submit}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <Divider />

      {/* ACTIONS SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            borderColor: alpha(theme.palette.text.primary, 0.2),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: alpha(theme.palette.text.primary, 0.4),
              bgcolor: alpha(theme.palette.text.primary, 0.04)
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear Tarea')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal de Vista Previa de Documentos */}
    <DocumentPreviewModal
      open={previewOpen}
      onClose={handleClosePreview}
      document={existingAttachment}
    />
    </>
  );
};

export default TaskDialog;
