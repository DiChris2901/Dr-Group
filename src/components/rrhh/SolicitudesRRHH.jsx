import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  FlightTakeoff as VacacionesIcon,
  MedicalServices as IncapacidadIcon,
  WatchLater as PermisoIcon,
  Celebration as CompensatorioIcon,
  Description as DocumentoIcon,
  Info as InfoIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  ChildCare as MaternidadIcon,
  AccountBalance as AdelantoIcon,
  Home as RemotoIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as InsertDriveFileIcon,
  GetApp as GetAppIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata, getBytes } from 'firebase/storage';
import { differenceInDays } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { combineFilesToPDF } from '../../utils/pdfCombiner';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js worker (Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const SolicitudesRRHH = ({ 
  solicitudes, 
  empleados, 
  userProfile, 
  showToast 
}) => {
  const theme = useTheme();
  const { hasPermission } = usePermissions();
  
  // Verificar si el usuario puede gestionar solicitudes de todos (aprobar/rechazar)
  // ⚠️ SOLO solicitudes.gestionar explícito o ALL — rrhh NO otorga gestión automáticamente
  const canManageSolicitudes = userProfile?.permissions?.['solicitudes.gestionar'] === true || userProfile?.permissions?.ALL === true;
  
  // Estados
  const [openSolicitudModal, setOpenSolicitudModal] = useState(false);
  const [editingSolicitudId, setEditingSolicitudId] = useState(null); // ID de solicitud en edición
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // Diálogo de confirmación
  const [confirmAction, setConfirmAction] = useState(null); // 'aprobar' | 'rechazar'
  const [selectedSolicitudId, setSelectedSolicitudId] = useState(null);
  const [comentarioAccion, setComentarioAccion] = useState('');
  const [uploadingCertificado, setUploadingCertificado] = useState(false);
  const [uploadingIncapacidad, setUploadingIncapacidad] = useState(false);
  const [uploadingDocLicencia, setUploadingDocLicencia] = useState({
    epicrisis: false,
    nacidoVivo: false,
    historiaClinica: false,
    registroCivil: false
  });
  const [filterSolicitudTipo, setFilterSolicitudTipo] = useState('todos');
  const [filterSolicitudEstado, setFilterSolicitudEstado] = useState('todos');
  const [searchSolicitud, setSearchSolicitud] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para Modal de Detalles y Visor PDF
  const [openDetallesModal, setOpenDetallesModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [openPDFViewer, setOpenPDFViewer] = useState(false);
  const [currentPDF, setCurrentPDF] = useState({ url: '', nombre: '' });
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [pdfViewerLoading, setPdfViewerLoading] = useState(false);
  const pdfBlobUrlRef = useRef(null);
  
  // Estados para Modal de Contraseña de PDF
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [pendingPasswordFile, setPendingPasswordFile] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [passwordError, setPasswordError] = useState('');
  
  // Estado para archivos pendientes (en memoria, antes de subir a Storage)
  const [pendingFiles, setPendingFiles] = useState({
    incapacidad: null,
    epicrisis: null,
    nacidoVivo: null,
    historiaClinica: null,
    registroCivil: null
  });
  
  // Form Solicitud
  const [formSolicitud, setFormSolicitud] = useState({
    tipo: 'vacaciones',
    empleadoId: '',
    empleadoNombre: '',
    fechaInicio: '',
    fechaFin: '',
    dias: 0,
    motivo: '',
    // Campos específicos para incapacidad
    incapacidadURL: '',
    incapacidadNombre: '',
    // Campos específicos para certificaciones
    dirigidoA: '',
    incluirSalario: false,
    fechaRequerida: '',
    // Campos específicos para licencias de maternidad/paternidad
    tipoLicencia: 'maternidad',
    fechaNacimiento: '',
    epicrisisURL: '',
    epicrisisNombre: '',
    nacidoVivoURL: '',
    nacidoVivoNombre: '',
    historiaClinicaURL: '',
    historiaClinicaNombre: '',
    registroCivilURL: '',
    registroCivilNombre: '',
    // Campos específicos para adelanto de nómina
    montoSolicitado: '',
    fechaDeduccion: '',
    // Campos específicos para trabajo remoto
    confirmaRecursos: false
  });

  // Helper: Obtener fecha actual en formato YYYY-MM-DD (zona horaria local, sin UTC)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Convertir YYYY-MM-DD a Date en zona horaria local (evita problema UTC)
  const createLocalDate = (dateString) => {
    if (!dateString) return null;
    // Agregar hora del mediodía para evitar cambios de día por zona horaria
    return new Date(dateString + 'T12:00:00');
  };

  // Helper: Convertir Timestamp de Firestore a Date de forma segura
  const toDate = (value) => {
    if (!value) return null;
    // Si es un Timestamp de Firestore, convertir a Date
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }
    // Si ya es un Date, devolverlo
    if (value instanceof Date) {
      return value;
    }
    // Si es un string, convertirlo
    if (typeof value === 'string') {
      return createLocalDate(value);
    }
    return null;
  };

  // Calcular días automáticamente
  React.useEffect(() => {
    if (formSolicitud.fechaInicio && formSolicitud.fechaFin) {
      const inicio = createLocalDate(formSolicitud.fechaInicio);
      const fin = createLocalDate(formSolicitud.fechaFin);
      const dias = differenceInDays(fin, inicio) + 1;
      setFormSolicitud(prev => ({ ...prev, dias: dias > 0 ? dias : 0 }));
    }
  }, [formSolicitud.fechaInicio, formSolicitud.fechaFin]);

  // Función auxiliar: Eliminar archivo de Firebase Storage
  const eliminarArchivoStorage = async (fileURL) => {
    if (!fileURL) return;
    
    try {
      // Extraer la ruta del archivo desde la URL de Firebase Storage
      // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const decodedURL = decodeURIComponent(fileURL);
      const pathMatch = decodedURL.match(/\/o\/(.+?)\?/);
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
    } catch (error) {
      // Si el archivo no existe (404), está bien - el objetivo ya se cumplió
      if (error.code === 'storage/object-not-found') {
      } else {
        // Solo loggear otros errores reales
        console.error('⚠️ Error al eliminar archivo de Storage:', error);
      }
      // No lanzar error para no bloquear la eliminación del documento
    }
  };

  // Función auxiliar: Verificar si un PDF tiene contraseña
  const pdfTieneContrasena = async (file) => {
    try {
      const fileBuffer = await file.arrayBuffer();
      // Intentar cargar el PDF normalmente (sin contraseña)
      await PDFDocument.load(fileBuffer);
      // Si carga exitosamente, NO tiene contraseña
      return false;
    } catch (error) {
      // Si el error menciona encriptación, tiene contraseña
      if (error.message && (
        error.message.toLowerCase().includes('encrypted') || 
        error.message.toLowerCase().includes('password') ||
        error.message.includes('decrypt')
      )) {
        return true; // Tiene contraseña
      }
      // Cualquier otro error (PDF corrupto, etc), re-lanzarlo
      console.error('Error inesperado al verificar PDF:', error);
      throw new Error(`Error al leer el PDF: ${error.message}`);
    }
  };

  // Función auxiliar: Desencriptar PDF con contraseña
  const desencriptarPDF = async (file, password) => {
    try {
      
      const fileBuffer = await file.arrayBuffer();
      
      // Fallback robusto: pdf-lib NO soporta todos los tipos de encriptación (AES/DRM)
      // Si pdf-lib falla, usamos PDF.js para desencriptar/renderizar y reempaquetar como PDF limpio.
      const desencriptarConPdfJs = async () => {
        const data = new Uint8Array(fileBuffer);

        const loadingTask = pdfjsLib.getDocument({ data, password });
        const pdf = await loadingTask.promise;

        try {
          const outputDoc = await PDFDocument.create();
          outputDoc.setCreator('Sistema RDJ');
          outputDoc.setProducer('RDJ PDF Sanitizer');

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw new Error('No se pudo inicializar canvas');

            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);

            await page.render({ canvasContext: context, viewport }).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const imageBytes = await (await fetch(dataUrl)).arrayBuffer();
            const jpgImage = await outputDoc.embedJpg(imageBytes);

            const pdfPage = outputDoc.addPage([viewport.width, viewport.height]);
            pdfPage.drawImage(jpgImage, {
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height
            });
          }

          const pdfBytes = await outputDoc.save();

          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const desencriptado = new File([blob], file.name, {
            type: 'application/pdf',
            lastModified: Date.now()
          });

          Object.defineProperty(desencriptado, '_yaDesencriptado', {
            value: true,
            writable: false,
            configurable: true
          });
          Object.defineProperty(desencriptado, '_sinEncriptacion', {
            value: true,
            writable: false,
            configurable: true
          });
          Object.defineProperty(desencriptado, '_estrategiaUsada', {
            value: 3,
            writable: false,
            configurable: true
          });

          return desencriptado;
        } finally {
          try {
            loadingTask.destroy();
          } catch {
            // no-op
          }
        }
      };

      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(fileBuffer, {
          password: password,
          updateMetadata: false
        });
      } catch (errorPdfLib) {
        try {
          return await desencriptarConPdfJs();
        } catch (errorPdfJs) {
          const message = String(errorPdfJs?.message || '');
          if (errorPdfJs?.name === 'PasswordException' || message.toLowerCase().includes('password')) {
            throw new Error('Contraseña incorrecta');
          }
          throw new Error(`Error al desencriptar: ${message || 'Error desconocido'}`);
        }
      }
      
      
      // ESTRATEGIA UNIFICADA: SIEMPRE RECONSTRUIR EL PDF
      // Esto garantiza eliminar cualquier rastro de encriptación o metadata restrictiva
      // Copiamos las páginas a un documento nuevo y limpio
      const newPdfDoc = await PDFDocument.create();
      newPdfDoc.setCreator('Sistema RDJ');
      newPdfDoc.setProducer('RDJ PDF Sanitizer');
      
      const pageCount = pdfDoc.getPageCount();
      
      // Copiar páginas del documento original (ya abierto) al nuevo documento
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: pageCount }, (_, i) => i));
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      
      // Guardar el nuevo documento limpio
      const pdfBytes = await newPdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Crear un nuevo File con el mismo nombre pero sin contraseña
      const desencriptado = new File([blob], file.name, { 
        type: 'application/pdf', 
        lastModified: Date.now() 
      });
      
      // Marcar el archivo como ya procesado para evitar bucles infinitos
      // Usar múltiples marcadores para mayor robustez
      Object.defineProperty(desencriptado, '_yaDesencriptado', {
        value: true,
        writable: false,
        configurable: true
      });
      Object.defineProperty(desencriptado, '_sinEncriptacion', {
        value: true,
        writable: false,
        configurable: true
      });
      Object.defineProperty(desencriptado, '_estrategiaUsada', {
        value: estrategiaExitosa,
        writable: false,
        configurable: true
      });
      
      
      // Verificar que el PDF NO esté encriptado
      try {
        const testBuffer = await desencriptado.arrayBuffer();
        await PDFDocument.load(testBuffer); // Si esto funciona, NO tiene contraseña
      } catch (verifyError) {
      }
      
      return desencriptado;
    } catch (error) {
      console.error(`❌ Error final en desencriptarPDF:`, error.message);
      
      // Si el error es específico de contraseña incorrecta
      if (error.message === 'Contraseña incorrecta') {
        throw error;
      }
      
      if (error.message && (
        error.message.toLowerCase().includes('password') || 
        error.message.toLowerCase().includes('incorrect') ||
        error.message.toLowerCase().includes('decrypt')
      )) {
        throw new Error('Contraseña incorrecta');
      }
      
      // Si el error dice que está encriptado, la contraseña es incorrecta
      if (error.message && error.message.toLowerCase().includes('encrypted')) {
        throw new Error('Contraseña incorrecta');
      }
      
      throw new Error(`Error al desencriptar: ${error.message}`);
    }
  };

  // Handler: Procesar archivos verificando contraseñas (Lógica Secuencial Mejorada)
  const procesarArchivosConValidacionContraseña = async (files, nombreBase, currentIndex = 0, archivosProcesados = []) => {
    try {
      // Caso base: Si ya procesamos todos, terminar y combinar
      if (currentIndex >= files.length) {
        const result = await procesarYCombinarArchivos(archivosProcesados, nombreBase);
        return result;
      }

      const file = files[currentIndex];
      
      // Verificar si es PDF y no ha sido desencriptado aún
      const yaDesencriptado = file._yaDesencriptado || file._sinEncriptacion;
      
      if (file.type === 'application/pdf' && !yaDesencriptado) {
        const tienePassword = await pdfTieneContrasena(file);
        
        if (tienePassword) {
          // Detener proceso y pedir contraseña
          return new Promise((resolve, reject) => {
            setPendingPasswordFile({ 
              file,             // Archivo actual problemático
              resolve,          // Para continuar la promesa principal
              reject,
              nombreBase,
              originalFiles: files,       // Mantenemos la lista original completa
              currentIndex,     // Índice donde nos quedamos
              archivosProcesados // Lo que ya llevamos limpio
            });
            setOpenPasswordModal(true);
            setPdfPassword('');
            setPasswordError('');
            setPasswordAttempts(0);
          });
        }
      }

      // Si no tiene password o ya fue procesado, agregarlo y seguir con el siguiente
      const nuevosProcesados = [...archivosProcesados, file];
      return procesarArchivosConValidacionContraseña(files, nombreBase, currentIndex + 1, nuevosProcesados);

    } catch (error) {
      console.error('❌ Error al validar contraseñas:', error);
      throw error;
    }
  };

  // Handler: Confirmar contraseña de PDF
  const handleConfirmarPassword = async () => {
    if (!pdfPassword.trim()) {
      setPasswordError('Por favor ingresa la contraseña');
      return;
    }

    try {
      // Recuperar estado completo
      const { file, resolve, nombreBase, originalFiles, currentIndex, archivosProcesados } = pendingPasswordFile;
      
      
      // Intentar desencriptar
      const archivoDesencriptado = await desencriptarPDF(file, pdfPassword);
      
      
      // Cerrar modal y limpiar estado UI
      setOpenPasswordModal(false);
      setPendingPasswordFile(null);
      setPdfPassword('');
      setPasswordError('');
      setPasswordAttempts(0);
      
      // Agregar el archivo desencriptado a los procesados
      const nuevosProcesados = [...archivosProcesados, archivoDesencriptado];
      
      // CONTINUAR RECURSIVIDAD con el siguiente índice
      // Nota: Pasamos 'originalFiles' sin modificar, pero avanzamos el índice y actualizamos los procesados
      const result = await procesarArchivosConValidacionContraseña(originalFiles, nombreBase, currentIndex + 1, nuevosProcesados);
      resolve(result);
      
    } catch (error) {
      console.error(`❌ Error password:`, error);
      const nuevoIntento = passwordAttempts + 1;
      setPasswordAttempts(nuevoIntento);
      
      if (error.message === 'Contraseña incorrecta' || error.message.toLowerCase().includes('encrypted')) {
        if (nuevoIntento >= 3) {
          setPasswordError(
            '3 intentos fallidos. Opciones: 1) Verificar contraseña, 2) Usar herramienta externa, 3) Subir encriptado (Botón abajo).'
          );
        } else {
          setPasswordError(`Contraseña incorrecta (Intento ${nuevoIntento}/3)`);
        }
      } else {
        setPasswordError('Error: ' + error.message);
      }
    }
  };

  // Handler: Cancelar contraseña
  const handleCancelarPassword = () => {
    setOpenPasswordModal(false);
    setPendingPasswordFile(null);
    setPdfPassword('');
    setPasswordError('');
    setPasswordAttempts(0);
    
    if (pendingPasswordFile && pendingPasswordFile.reject) {
      pendingPasswordFile.reject(new Error('Usuario canceló la operación'));
    }
  };

  // Handler: Subir PDF encriptado sin desencriptar (opción de emergencia)
  const handleSubirEncriptado = async () => {
    try {
      const { file, resolve, nombreBase, originalFiles, currentIndex, archivosProcesados } = pendingPasswordFile;
      
      // Cerrar modal
      setOpenPasswordModal(false);
      setPendingPasswordFile(null);
      setPdfPassword('');
      setPasswordError('');
      
      showToast('PDF subido con contraseña. Puede no ser visible en el sistema.', 'warning');
      
      // Agregar el archivo ORIGINAL (encriptado) a los procesados
      const nuevosProcesados = [...archivosProcesados, file];
      
      // Continuar con el siguiente
      const result = await procesarArchivosConValidacionContraseña(originalFiles, nombreBase, currentIndex + 1, nuevosProcesados);
      resolve(result);
    } catch (error) {
      console.error('❌ Error al subir encriptado:', error);
      setPasswordError('Error: ' + error.message);
    }
  };

  // Función auxiliar: Procesar y combinar múltiples archivos en un solo PDF
  const procesarYCombinarArchivos = async (files, nombreBase) => {
    if (!files || files.length === 0) return null;

    try {

      // Si es solo 1 archivo y ya es PDF, subirlo directamente sin procesamiento
      if (files.length === 1 && files[0].type === 'application/pdf') {
        return {
          blob: files[0],
          fileName: files[0].name,
          stats: null
        };
      }

      // Si es solo 1 archivo imagen, convertirlo a PDF
      if (files.length === 1 && files[0].type.startsWith('image/')) {
        const result = await combineFilesToPDF([files[0]], { title: nombreBase });
        return {
          blob: result.combinedPDF,
          fileName: `${nombreBase}_${Date.now()}.pdf`,
          stats: result.stats
        };
      }

      // Si hay múltiples archivos (PDFs + imágenes), combinarlos
      const result = await combineFilesToPDF(files, { title: nombreBase });
      
      // Validar tamaño del PDF combinado (máx 25MB)
      const pdfSizeMB = result.combinedPDF.size / (1024 * 1024);
      if (result.combinedPDF.size > 25 * 1024 * 1024) {
        throw new Error(`El PDF combinado (${pdfSizeMB.toFixed(2)}MB) supera los 25MB. Intenta con menos archivos.`);
      }

      return {
        blob: result.combinedPDF,
        fileName: `${nombreBase}_${Date.now()}.pdf`,
        stats: result.stats
      };

    } catch (error) {
      console.error('❌ Error al procesar archivos:', error);
      throw error;
    }
  };

  // Helper: Subir archivos pendientes a Storage antes de crear la solicitud
  const subirArchivosPendientes = async (empleadoId) => {
    const urls = {};
    const nombres = {};
    const uploadedRefs = [];

    try {
      // Subir Incapacidad
      if (pendingFiles.incapacidad) {
        const storageRef = ref(storage, `incapacidades/${pendingFiles.incapacidad.fileName}`);
        await uploadBytes(storageRef, pendingFiles.incapacidad.blob);
        uploadedRefs.push(storageRef);
        urls.incapacidadURL = await getDownloadURL(storageRef);
        nombres.incapacidadNombre = pendingFiles.incapacidad.stats 
          ? `${pendingFiles.incapacidad.stats.processedFiles} archivo(s) combinado(s)` 
          : pendingFiles.incapacidad.fileName;
      }

      // Subir Epicrisis
      if (pendingFiles.epicrisis) {
        const storageRef = ref(storage, `licencias/${pendingFiles.epicrisis.fileName}`);
        await uploadBytes(storageRef, pendingFiles.epicrisis.blob);
        uploadedRefs.push(storageRef);
        urls.epicrisisURL = await getDownloadURL(storageRef);
        nombres.epicrisisNombre = pendingFiles.epicrisis.stats 
          ? `${pendingFiles.epicrisis.stats.processedFiles} archivo(s) combinado(s)` 
          : pendingFiles.epicrisis.fileName;
      }

      // Subir Nacido Vivo
      if (pendingFiles.nacidoVivo) {
        const storageRef = ref(storage, `licencias/${pendingFiles.nacidoVivo.fileName}`);
        await uploadBytes(storageRef, pendingFiles.nacidoVivo.blob);
        uploadedRefs.push(storageRef);
        urls.nacidoVivoURL = await getDownloadURL(storageRef);
        nombres.nacidoVivoNombre = pendingFiles.nacidoVivo.stats 
          ? `${pendingFiles.nacidoVivo.stats.processedFiles} archivo(s) combinado(s)` 
          : pendingFiles.nacidoVivo.fileName;
      }

      // Subir Historia Clínica
      if (pendingFiles.historiaClinica) {
        const storageRef = ref(storage, `licencias/${pendingFiles.historiaClinica.fileName}`);
        await uploadBytes(storageRef, pendingFiles.historiaClinica.blob);
        uploadedRefs.push(storageRef);
        urls.historiaClinicaURL = await getDownloadURL(storageRef);
        nombres.historiaClinicaNombre = pendingFiles.historiaClinica.stats 
          ? `${pendingFiles.historiaClinica.stats.processedFiles} archivo(s) combinado(s)` 
          : pendingFiles.historiaClinica.fileName;
      }

      // Subir Registro Civil
      if (pendingFiles.registroCivil) {
        const storageRef = ref(storage, `licencias/${pendingFiles.registroCivil.fileName}`);
        await uploadBytes(storageRef, pendingFiles.registroCivil.blob);
        uploadedRefs.push(storageRef);
        urls.registroCivilURL = await getDownloadURL(storageRef);
        nombres.registroCivilNombre = pendingFiles.registroCivil.stats 
          ? `${pendingFiles.registroCivil.stats.processedFiles} archivo(s) combinado(s)` 
          : pendingFiles.registroCivil.fileName;
      }

      return { urls, nombres };
    } catch (error) {
      console.error('❌ Error al subir archivos pendientes:', error);

      // Rollback: si algo falla, eliminar lo que ya se alcanzó a subir en este batch
      if (uploadedRefs.length > 0) {
        try {
          await Promise.all(
            uploadedRefs.map(async (fileRef) => {
              try {
                await deleteObject(fileRef);
              } catch (deleteErr) {
                if (deleteErr?.code !== 'storage/object-not-found') {
                }
              }
            })
          );
        } catch (rollbackErr) {
        }
      }

      throw new Error('Error al subir archivos a Storage');
    }
  };

  // Crear o actualizar solicitud
  const handleCrearSolicitud = async () => {
    try {
      // Validación base
      if (!formSolicitud.empleadoId) {
        showToast('Por favor selecciona un empleado', 'warning');
        return;
      }

      // Validación de fechas solo para solicitudes que no sean certificaciones
      if (!['certificacion', 'adelanto'].includes(formSolicitud.tipo)) {
        if (!formSolicitud.fechaInicio || !formSolicitud.fechaFin) {
          showToast('Por favor completa las fechas de inicio y fin', 'warning');
          return;
        }
        
        // Validación: fechas futuras (excepto incapacidades que pueden ser retroactivas)
        if (formSolicitud.tipo !== 'incapacidad') {
          const hoyString = getTodayDateString(); // YYYY-MM-DD en hora local
          const fechaInicioString = formSolicitud.fechaInicio; // Ya es YYYY-MM-DD
          
          if (fechaInicioString < hoyString) {
            showToast('La fecha de inicio no puede ser anterior a hoy', 'warning');
            return;
          }
        }
      }

      // Validaciones específicas por tipo
      if (formSolicitud.tipo === 'certificacion') {
        if (!formSolicitud.motivo || !formSolicitud.dirigidoA) {
          showToast('Por favor completa el tipo de certificación y a quién va dirigida', 'warning');
          return;
        }
      }
      
      if (formSolicitud.tipo === 'incapacidad') {
        // Verificar archivo pendiente o URL existente (edición)
        if (!pendingFiles.incapacidad && !formSolicitud.incapacidadURL) {
          showToast('Por favor adjunta el documento de la incapacidad', 'warning');
          return;
        }
      }
      
      if (formSolicitud.tipo === 'licencia_maternidad') {
        if (!formSolicitud.fechaNacimiento) {
          showToast('Por favor indica la fecha de nacimiento o adopción', 'warning');
          return;
        }
        // Validar documentos obligatorios (Registro Civil es opcional)
        // Verificar archivos pendientes O URLs existentes (en caso de edición)
        const docsRequeridos = [
          { 
            campo: 'epicrisisURL', 
            pendiente: 'epicrisis',
            nombre: 'Epicrisis' 
          },
          { 
            campo: 'nacidoVivoURL', 
            pendiente: 'nacidoVivo',
            nombre: 'Certificado de Nacido Vivo' 
          },
          { 
            campo: 'historiaClinicaURL', 
            pendiente: 'historiaClinica',
            nombre: 'Historia Clínica' 
          }
          // Registro Civil es OPCIONAL (difícil de obtener inmediatamente)
        ];
        
        const docsFaltantes = docsRequeridos.filter(doc => 
          !pendingFiles[doc.pendiente] && !formSolicitud[doc.campo]
        );
        
        if (docsFaltantes.length > 0) {
          const nombresFaltantes = docsFaltantes.map(d => d.nombre).join(', ');
          showToast(`Documentos faltantes: ${nombresFaltantes}`, 'warning');
          return;
        }
      }
      
      if (formSolicitud.tipo === 'adelanto') {
        if (!formSolicitud.montoSolicitado || !formSolicitud.fechaDeduccion) {
          showToast('Por favor completa el monto y la fecha de deducción', 'warning');
          return;
        }
      }
      
      const empleado = empleados.find(e => e.id === formSolicitud.empleadoId);
      
      // 🚀 PASO 1: Subir archivos pendientes a Storage antes de crear la solicitud
      let uploadedFiles = { urls: {}, nombres: {} };
      if (!editingSolicitudId && (pendingFiles.incapacidad || pendingFiles.epicrisis || pendingFiles.nacidoVivo || pendingFiles.historiaClinica || pendingFiles.registroCivil)) {
        try {
          uploadedFiles = await subirArchivosPendientes(formSolicitud.empleadoId);
        } catch (error) {
          console.error('❌ Error al subir archivos adjuntos:', error);
          showToast('Error al subir archivos adjuntos', 'error');
          throw error;
        }
      }
      
      // Estructura base del documento
      const solicitudData = {
        tipo: formSolicitud.tipo,
        empleadoId: formSolicitud.empleadoId,
        empleadoNombre: empleado?.nombre || formSolicitud.empleadoNombre,
        empleadoEmail: empleado?.email || '',
        motivo: formSolicitud.motivo,
        estado: editingSolicitudId ? formSolicitud.estado || 'pendiente' : 'pendiente',
        fechaSolicitud: editingSolicitudId ? (formSolicitud.fechaSolicitud || Timestamp.now()) : Timestamp.now(),
        creadoPor: formSolicitud.creadoPor || userProfile.uid,
        creadoPorNombre: formSolicitud.creadoPorNombre || userProfile.name || userProfile.displayName
      };

      // Agregar campos según tipo
      if (!['certificacion', 'adelanto'].includes(formSolicitud.tipo)) {
        solicitudData.fechaInicio = Timestamp.fromDate(createLocalDate(formSolicitud.fechaInicio));
        solicitudData.fechaFin = Timestamp.fromDate(createLocalDate(formSolicitud.fechaFin));
        solicitudData.dias = formSolicitud.dias;
      }
      
      // Campos específicos por tipo
      if (formSolicitud.tipo === 'certificacion') {
        solicitudData.dirigidoA = formSolicitud.dirigidoA;
        solicitudData.incluirSalario = formSolicitud.incluirSalario;
        if (formSolicitud.fechaRequerida) {
          solicitudData.fechaRequerida = Timestamp.fromDate(createLocalDate(formSolicitud.fechaRequerida));
        }
      } else if (formSolicitud.tipo === 'incapacidad') {
        // Usar URLs de archivos recién subidos o las existentes (en caso de edición)
        solicitudData.incapacidadURL = uploadedFiles.urls.incapacidadURL || formSolicitud.incapacidadURL || '';
        solicitudData.incapacidadNombre = uploadedFiles.nombres.incapacidadNombre || formSolicitud.incapacidadNombre || '';
      } else if (formSolicitud.tipo === 'licencia_maternidad') {
        solicitudData.tipoLicencia = formSolicitud.tipoLicencia;
        solicitudData.fechaNacimiento = Timestamp.fromDate(createLocalDate(formSolicitud.fechaNacimiento));
        // Usar URLs de archivos recién subidos o las existentes (en caso de edición)
        solicitudData.epicrisisURL = uploadedFiles.urls.epicrisisURL || formSolicitud.epicrisisURL || '';
        solicitudData.epicrisisNombre = uploadedFiles.nombres.epicrisisNombre || formSolicitud.epicrisisNombre || '';
        solicitudData.nacidoVivoURL = uploadedFiles.urls.nacidoVivoURL || formSolicitud.nacidoVivoURL || '';
        solicitudData.nacidoVivoNombre = uploadedFiles.nombres.nacidoVivoNombre || formSolicitud.nacidoVivoNombre || '';
        solicitudData.historiaClinicaURL = uploadedFiles.urls.historiaClinicaURL || formSolicitud.historiaClinicaURL || '';
        solicitudData.historiaClinicaNombre = uploadedFiles.nombres.historiaClinicaNombre || formSolicitud.historiaClinicaNombre || '';
        solicitudData.registroCivilURL = uploadedFiles.urls.registroCivilURL || formSolicitud.registroCivilURL || '';
        solicitudData.registroCivilNombre = uploadedFiles.nombres.registroCivilNombre || formSolicitud.registroCivilNombre || '';
      } else if (formSolicitud.tipo === 'adelanto') {
        solicitudData.montoSolicitado = formSolicitud.montoSolicitado;
        solicitudData.fechaDeduccion = Timestamp.fromDate(createLocalDate(formSolicitud.fechaDeduccion));
      } else if (formSolicitud.tipo === 'remoto') {
        solicitudData.confirmaRecursos = formSolicitud.confirmaRecursos;
      }
      
      if (editingSolicitudId) {
        // Actualizar solicitud existente
        await updateDoc(doc(db, 'solicitudes', editingSolicitudId), solicitudData);
        showToast('Solicitud actualizada exitosamente', 'success');
      } else {
        // Crear nueva solicitud
        await addDoc(collection(db, 'solicitudes'), solicitudData);
        showToast('Solicitud creada exitosamente', 'success');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear/actualizar solicitud:', error);
      showToast('Error al procesar la solicitud', 'error');
    }
  };

  // Aprobar solicitud - Abre diálogo de confirmación
  const handleAprobarSolicitud = (solicitudId) => {
    setSelectedSolicitudId(solicitudId);
    setConfirmAction('aprobar');
    setComentarioAccion('');
    setOpenConfirmDialog(true);
  };

  // Confirmar aprobación (ejecuta después del diálogo)
  const confirmarAprobacion = async () => {
    try {
      await updateDoc(doc(db, 'solicitudes', selectedSolicitudId), {
        estado: 'aprobada',
        aprobadoPor: userProfile.uid,
        aprobadoPorNombre: userProfile.name || userProfile.displayName,
        fechaAprobacion: Timestamp.now(),
        comentarioAprobacion: comentarioAccion || 'Sin comentarios'
      });
      showToast('Solicitud aprobada exitosamente', 'success');
      handleCloseConfirmDialog();
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      showToast('Error al aprobar la solicitud', 'error');
    }
  };

  // Rechazar solicitud - Abre diálogo de confirmación
  const handleRechazarSolicitud = (solicitudId) => {
    setSelectedSolicitudId(solicitudId);
    setConfirmAction('rechazar');
    setComentarioAccion('');
    setOpenConfirmDialog(true);
  };

  // Confirmar rechazo (ejecuta después del diálogo)
  const confirmarRechazo = async () => {
    // Validar que el comentario sea obligatorio para rechazos
    if (!comentarioAccion || comentarioAccion.trim() === '') {
      showToast('Debes especificar el motivo del rechazo', 'warning');
      return;
    }

    try {
      await updateDoc(doc(db, 'solicitudes', selectedSolicitudId), {
        estado: 'rechazada',
        rechazadoPor: userProfile.uid,
        rechazadoPorNombre: userProfile.name || userProfile.displayName,
        fechaRechazo: Timestamp.now(),
        motivoRechazo: comentarioAccion
      });
      showToast('Solicitud rechazada', 'info');
      handleCloseConfirmDialog();
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      showToast('Error al rechazar la solicitud', 'error');
    }
  };

  // Cerrar diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setConfirmAction(null);
    setSelectedSolicitudId(null);
    setComentarioAccion('');
  };

  // Ejecutar acción según el tipo (aprobar/rechazar)
  const handleConfirmAction = () => {
    if (confirmAction === 'aprobar') {
      confirmarAprobacion();
    } else if (confirmAction === 'rechazar') {
      confirmarRechazo();
    }
  };

  // Subir certificado (Admin RRHH) - Upload con soporte múltiple y combinación
  const handleSubirCertificado = (solicitud) => {
    // Crear input file oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;  // Permitir múltiples archivos
    input.accept = '.pdf,image/*';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      // Validar tamaño total antes de procesamiento
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 50 * 1024 * 1024) {
        showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
        return;
      }
      
      setUploadingCertificado(true);
      
      try {
        // Procesar y combinar archivos (con validación de contraseñas)
        const result = await procesarArchivosConValidacionContraseña(files, 'certificado');
        if (!result) throw new Error('Error al procesar archivos');

        // Upload a Storage
        const timestamp = Date.now();
        const fileName = `cert_${solicitud.empleadoId}_${timestamp}.pdf`;
        const storageRef = ref(storage, `certificados/${fileName}`);
        
        await uploadBytes(storageRef, result.blob);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Actualizar solicitud en Firestore
        const solicitudRef = doc(db, 'solicitudes', solicitud.id);
        await updateDoc(solicitudRef, {
          estado: 'enviado',
          fechaEnvio: new Date(),
          certificadoURL: downloadURL,
          certificadoNombre: result.stats 
            ? `${result.stats.processedFiles} archivo(s) combinado(s)` 
            : result.fileName
        });
        
        const mensaje = files.length > 1 
          ? `${files.length} archivos combinados y enviados exitosamente`
          : 'Certificado subido y enviado exitosamente';
        showToast(mensaje, 'success');
      } catch (error) {
        console.error('Error al subir certificado:', error);
        showToast('Error al subir el certificado', 'error');
      } finally {
        setUploadingCertificado(false);
      }
    };
    
    input.click();
  };

  // Ver/Descargar certificado - Si está "enviado", cambia automáticamente a "recibido"
  const handleVerCertificado = async (solicitud) => {
    try {
      if (!solicitud.certificadoURL) {
        showToast('No hay certificado disponible', 'warning');
        return;
      }
      
      // Si el usuario lo ve por primera vez, marcar como recibido
      if (solicitud.estado === 'enviado') {
        const solicitudRef = doc(db, 'solicitudes', solicitud.id);
        await updateDoc(solicitudRef, {
          estado: 'recibido',
          fechaRecepcion: new Date()
        });
      }
      
      // Abrir certificado en nueva pestaña
      window.open(solicitud.certificadoURL, '_blank');
    } catch (error) {
      console.error('Error al abrir certificado:', error);
      showToast('Error al abrir el certificado', 'error');
    }
  };

  // Eliminar solicitud (con limpieza automática de archivos en Storage)
  const handleEliminarSolicitud = async (solicitudId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud? Los archivos adjuntos también serán eliminados.')) return;
    
    try {
      // PASO 1: Obtener la solicitud desde Firestore para conocer los archivos adjuntos
      const solicitudRef = doc(db, 'solicitudes', solicitudId);
      const solicitudSnap = await getDoc(solicitudRef);
      
      if (solicitudSnap.exists()) {
        const solicitudData = solicitudSnap.data();
        
        // PASO 2: Recolectar todas las URLs de archivos adjuntos
        const archivosAEliminar = [];
        
        // Certificado laboral
        if (solicitudData.certificadoURL) {
          archivosAEliminar.push(solicitudData.certificadoURL);
        }
        
        // Incapacidad médica
        if (solicitudData.incapacidadURL) {
          archivosAEliminar.push(solicitudData.incapacidadURL);
        }
        
        // Documentos de licencia maternidad/paternidad (4 archivos)
        if (solicitudData.epicrisisURL) archivosAEliminar.push(solicitudData.epicrisisURL);
        if (solicitudData.nacidoVivoURL) archivosAEliminar.push(solicitudData.nacidoVivoURL);
        if (solicitudData.historiaClinicaURL) archivosAEliminar.push(solicitudData.historiaClinicaURL);
        if (solicitudData.registroCivilURL) archivosAEliminar.push(solicitudData.registroCivilURL);
        
        // PASO 3: Eliminar archivos de Storage (en paralelo para velocidad)
        if (archivosAEliminar.length > 0) {
          await Promise.all(
            archivosAEliminar.map(url => eliminarArchivoStorage(url))
          );
        }
      }
      
      // PASO 4: Eliminar el documento de Firestore
      await deleteDoc(solicitudRef);
      showToast('Solicitud y archivos eliminados exitosamente', 'success');
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      showToast('Error al eliminar la solicitud', 'error');
    }
  };

  // Abrir modal
  const handleNuevaSolicitud = () => {
    // Limpiar archivos pendientes de sesiones anteriores
    setPendingFiles({
      incapacidad: null,
      epicrisis: null,
      nacidoVivo: null,
      historiaClinica: null,
      registroCivil: null
    });
    
    // Si NO es admin de RRHH, auto-seleccionar el usuario actual
    const initialForm = {
      tipo: 'vacaciones',
      empleadoId: canManageSolicitudes ? '' : (userProfile?.uid || ''),
      empleadoNombre: canManageSolicitudes ? '' : (userProfile?.name || userProfile?.displayName || userProfile?.email || ''),
      fechaInicio: '',
      fechaFin: '',
      dias: 0,
      motivo: '',
      incapacidadURL: '',
      incapacidadNombre: '',
      dirigidoA: '',
      incluirSalario: false,
      fechaRequerida: '',
      tipoLicencia: 'maternidad',
      fechaNacimiento: '',
      epicrisisURL: '',
      epicrisisNombre: '',
      nacidoVivoURL: '',
      nacidoVivoNombre: '',
      historiaClinicaURL: '',
      historiaClinicaNombre: '',
      registroCivilURL: '',
      registroCivilNombre: '',
      montoSolicitado: '',
      fechaDeduccion: '',
      confirmaRecursos: false
    };
    setFormSolicitud(initialForm);
    setOpenSolicitudModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenSolicitudModal(false);
    setEditingSolicitudId(null);
    // Limpiar archivos pendientes
    setPendingFiles({
      incapacidad: null,
      epicrisis: null,
      nacidoVivo: null,
      historiaClinica: null,
      registroCivil: null
    });
    // Resetear formulario
    setFormSolicitud({
      tipo: 'vacaciones',
      empleadoId: '',
      empleadoNombre: '',
      fechaInicio: '',
      fechaFin: '',
      dias: 0,
      motivo: '',
      incapacidadURL: '',
      incapacidadNombre: '',
      dirigidoA: '',
      incluirSalario: false,
      fechaRequerida: '',
      tipoLicencia: 'maternidad',
      fechaNacimiento: '',
      epicrisisURL: '',
      epicrisisNombre: '',
      nacidoVivoURL: '',
      nacidoVivoNombre: '',
      historiaClinicaURL: '',
      historiaClinicaNombre: '',
      registroCivilURL: '',
      registroCivilNombre: '',
      montoSolicitado: '',
      fechaDeduccion: '',
      confirmaRecursos: false
    });
  };

  // Editar solicitud existente
  const handleEditarSolicitud = (solicitud) => {
    setEditingSolicitudId(solicitud.id);
    
    // Convertir fechas a formato YYYY-MM-DD para inputs date
    const formatDateForInput = (date) => {
      if (!date) return '';
      const dateObj = toDate(date); // Usa toDate() para manejar Timestamps
      if (!dateObj) return '';
      return dateObj.toISOString().split('T')[0];
    };

    setFormSolicitud({
      tipo: solicitud.tipo || 'vacaciones',
      empleadoId: solicitud.empleadoId || '',
      empleadoNombre: solicitud.empleadoNombre || '',
      fechaInicio: formatDateForInput(solicitud.fechaInicio),
      fechaFin: formatDateForInput(solicitud.fechaFin),
      dias: solicitud.dias || 0,
      motivo: solicitud.motivo || '',
      incapacidadURL: solicitud.incapacidadURL || '',
      incapacidadNombre: solicitud.incapacidadNombre || '',
      dirigidoA: solicitud.dirigidoA || '',
      incluirSalario: solicitud.incluirSalario || false,
      fechaRequerida: formatDateForInput(solicitud.fechaRequerida),
      tipoLicencia: solicitud.tipoLicencia || 'maternidad',
      fechaNacimiento: formatDateForInput(solicitud.fechaNacimiento),
      epicrisisURL: solicitud.epicrisisURL || '',
      epicrisisNombre: solicitud.epicrisisNombre || '',
      nacidoVivoURL: solicitud.nacidoVivoURL || '',
      nacidoVivoNombre: solicitud.nacidoVivoNombre || '',
      historiaClinicaURL: solicitud.historiaClinicaURL || '',
      historiaClinicaNombre: solicitud.historiaClinicaNombre || '',
      registroCivilURL: solicitud.registroCivilURL || '',
      registroCivilNombre: solicitud.registroCivilNombre || '',
      montoSolicitado: solicitud.montoSolicitado || '',
      fechaDeduccion: formatDateForInput(solicitud.fechaDeduccion),
      confirmaRecursos: solicitud.confirmaRecursos || false,
      estado: solicitud.estado,
      fechaSolicitud: solicitud.fechaSolicitud,
      creadoPor: solicitud.creadoPor,
      creadoPorNombre: solicitud.creadoPorNombre
    });
    
    setOpenSolicitudModal(true);
  };

  // Helper: Ícono según tipo con colores vibrantes
  const getTipoIcon = (tipo) => {
    const iconStyles = { fontSize: 20 };
    switch (tipo) {
      case 'vacaciones': 
        return <VacacionesIcon sx={{ ...iconStyles, color: theme.palette.info.main }} />;
      case 'permiso': 
        return <PermisoIcon sx={{ ...iconStyles, color: theme.palette.warning.main }} />;
      case 'incapacidad': 
        return <IncapacidadIcon sx={{ ...iconStyles, color: theme.palette.error.main }} />;
      case 'compensatorio': 
        return <CompensatorioIcon sx={{ ...iconStyles, color: theme.palette.secondary.main }} />;
      case 'certificacion': 
        return <DocumentoIcon sx={{ ...iconStyles, color: theme.palette.primary.main }} />;
      case 'licencia_maternidad': 
        return <MaternidadIcon sx={{ ...iconStyles, color: theme.palette.secondary.main }} />;
      case 'adelanto': 
        return <AdelantoIcon sx={{ ...iconStyles, color: theme.palette.success.main }} />;
      case 'remoto': 
        return <RemotoIcon sx={{ ...iconStyles, color: theme.palette.info.main }} />;
      default: 
        return <AssignmentIcon sx={iconStyles} />;
    }
  };

  // Helper: Nombre amigable del tipo
  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'vacaciones': return 'Vacaciones';
      case 'permiso': return 'Permiso';
      case 'incapacidad': return 'Incapacidad';
      case 'compensatorio': return 'Día Compensatorio';
      case 'certificacion': return 'Certificación Laboral';
      case 'licencia_maternidad': return 'Licencia Maternidad/Paternidad';
      case 'adelanto': return 'Adelanto de Nómina';
      case 'remoto': return 'Trabajo Remoto';
      default: return tipo;
    }
  };

  // Helper: Color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'success';
      case 'rechazada': return 'error';
      case 'pendiente': return 'warning';
      case 'enviado': return 'info';
      case 'recibido': return 'success';
      default: return 'default';
    }
  };

  // Handler: Abrir modal de detalles
  const handleOpenDetalles = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setOpenDetallesModal(true);
  };

  // Handler: Cerrar modal de detalles
  const handleCloseDetalles = () => {
    setOpenDetallesModal(false);
    setSelectedSolicitud(null);
  };

  // Handler: Abrir visor PDF
  const handleOpenPDF = async (url, nombre) => {
    setOpenPDFViewer(true);
    setCurrentPDF({ url: '', nombre });
    setDocumentInfoOpen(false);
    setPdfViewerLoading(true);

    try {
      const fileRef = ref(storage, url);

      // Descargar con el SDK para respetar reglas (auth) y evitar 403 en iframe
      const bytes = await getBytes(fileRef, 30 * 1024 * 1024);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
      pdfBlobUrlRef.current = objectUrl;

      setCurrentPDF({ url: objectUrl, nombre });

      // Obtener metadatos del archivo
      try {
        const metadata = await getMetadata(fileRef);
        setDocumentInfo({
          nombre: nombre,
          tamano: metadata.size,
          tipo: metadata.contentType,
          fechaSubida: metadata.timeCreated,
          path: metadata.fullPath,
          url: url
        });
      } catch (error) {
        console.error('Error al obtener metadatos:', error);
        setDocumentInfo({
          nombre: nombre,
          url: url
        });
      }
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      showToast('Error al cargar el documento', 'error');
      setOpenPDFViewer(false);
      setCurrentPDF({ url: '', nombre: '' });
      setDocumentInfo(null);
      setDocumentInfoOpen(false);
    } finally {
      setPdfViewerLoading(false);
    }
  };

  // Handler: Cerrar visor PDF
  const handleClosePDF = () => {
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }
    setOpenPDFViewer(false);
    setCurrentPDF({ url: '', nombre: '' });
    setDocumentInfo(null);
    setDocumentInfoOpen(false);
  };

  // Handler: Toggle información del documento
  const handleToggleDocumentInfo = () => {
    setDocumentInfoOpen(!documentInfoOpen);
  };

  // Helper: Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper: Formatear tipo de documento
  const formatDocumentType = (mimeType) => {
    if (!mimeType) return 'Documento';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return `Imagen ${mimeType.split('/')[1].toUpperCase()}`;
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Documento Word';
    return mimeType.split('/')[1].toUpperCase();
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(sol => {
    const matchTipo = filterSolicitudTipo === 'todos' || sol.tipo === filterSolicitudTipo;
    const matchEstado = filterSolicitudEstado === 'todos' || sol.estado === filterSolicitudEstado;
    const matchSearch = searchSolicitud === '' || 
      sol.empleadoNombre.toLowerCase().includes(searchSolicitud.toLowerCase());
    return matchTipo && matchEstado && matchSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* HEADER */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {canManageSolicitudes ? 'Gestión de Solicitudes' : 'Mis Solicitudes'}
        </Typography>
        {/* Solo mostrar botón "Nueva Solicitud" para usuarios sin permiso de gestión */}
        {!canManageSolicitudes && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNuevaSolicitud}
            sx={{
              backgroundColor: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            Nueva Solicitud
          </Button>
        )}
      </Box>

      {/* FILTROS */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterSolicitudTipo}
                label="Tipo"
                onChange={(e) => setFilterSolicitudTipo(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="vacaciones">Vacaciones</MenuItem>
                <MenuItem value="permiso">Permiso</MenuItem>
                <MenuItem value="incapacidad">Incapacidad</MenuItem>
                <MenuItem value="compensatorio">Día Compensatorio</MenuItem>
                <MenuItem value="certificacion">Certificación Laboral</MenuItem>
                <MenuItem value="licencia_maternidad">Licencia Maternidad/Paternidad</MenuItem>
                <MenuItem value="adelanto">Adelanto de Nómina</MenuItem>
                <MenuItem value="remoto">Trabajo Remoto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterSolicitudEstado}
                label="Estado"
                onChange={(e) => setFilterSolicitudEstado(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendiente">Pendientes</MenuItem>
                <MenuItem value="aprobada">Aprobadas</MenuItem>
                <MenuItem value="rechazada">Rechazadas</MenuItem>
                <MenuItem value="enviado">Enviado (Certificados)</MenuItem>
                <MenuItem value="recibido">Recibido (Certificados)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {canManageSolicitudes && (
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Buscar empleado"
                value={searchSolicitud}
                onChange={(e) => setSearchSolicitud(e.target.value)}
                placeholder="Nombre..."
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* CARDS DE SOLICITUDES */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {solicitudesFiltradas.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              p: 6,
              textAlign: 'center'
            }}
          >
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No hay solicitudes registradas
            </Typography>
          </Paper>
        ) : (
          solicitudesFiltradas
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((solicitud) => (
              <Paper
                key={solicitud.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  p: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* COLUMNA 1: Tipo y Empleado */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      {getTipoIcon(solicitud.tipo)}
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {getTipoLabel(solicitud.tipo)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {solicitud.empleadoNombre}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* COLUMNA 2: Información Condicional según Tipo */}
                  <Grid item xs={12} sm={5}>
                    {solicitud.tipo === 'certificacion' ? (
                      // CERTIFICACIONES: Solo mostrar estado y fecha solicitud
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Fecha Solicitud
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {format(toDate(solicitud.fechaSolicitud), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>
                    ) : solicitud.tipo === 'licencia_maternidad' ? (
                      // LICENCIAS: Mostrar tipo y fecha de nacimiento
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          {solicitud.tipoLicencia === 'maternidad' ? 'Maternidad (18 semanas)' : 'Paternidad (2 semanas)'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Fecha: {solicitud.fechaNacimiento && format(toDate(solicitud.fechaNacimiento), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {solicitud.epicrisisURL && (
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              label="Epicrisis"
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => window.open(solicitud.epicrisisURL, '_blank')}
                              sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                            />
                          )}
                          {solicitud.nacidoVivoURL && (
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              label="Nacido Vivo"
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => window.open(solicitud.nacidoVivoURL, '_blank')}
                              sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                            />
                          )}
                          {solicitud.historiaClinicaURL && (
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              label="Historia Clínica"
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => window.open(solicitud.historiaClinicaURL, '_blank')}
                              sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                            />
                          )}
                          {solicitud.registroCivilURL && (
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              label="Registro Civil"
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => window.open(solicitud.registroCivilURL, '_blank')}
                              sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                            />
                          )}
                        </Box>
                      </Box>
                    ) : solicitud.tipo === 'adelanto' ? (
                      // ADELANTO: Mostrar monto y fecha de deducción
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Monto Solicitado
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                          {solicitud.montoSolicitado}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Deducción: {solicitud.fechaDeduccion && format(toDate(solicitud.fechaDeduccion), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>
                    ) : solicitud.tipo === 'incapacidad' ? (
                      // INCAPACIDAD: Mostrar fechas, días y documento adjunto
                      <Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Fecha Inicio
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {solicitud.fechaInicio && format(toDate(solicitud.fechaInicio), 'dd MMM yyyy', { locale: es })}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Fecha Fin
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {solicitud.fechaFin && format(toDate(solicitud.fechaFin), 'dd MMM yyyy', { locale: es })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Chip
                              label={`${solicitud.dias} día${solicitud.dias !== 1 ? 's' : ''}`}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                fontWeight: 600,
                                borderRadius: 1
                              }}
                            />
                          </Grid>
                        </Grid>
                        {solicitud.incapacidadURL && (
                          <Box sx={{ mt: 1.5 }}>
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              label="Incapacidad Médica"
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => window.open(solicitud.incapacidadURL, '_blank')}
                              sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                            />
                          </Box>
                        )}
                      </Box>
                    ) : (
                      // VACACIONES/PERMISOS/REMOTO: Mostrar fechas y días
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Fecha Inicio
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {solicitud.fechaInicio && format(toDate(solicitud.fechaInicio), 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Fecha Fin
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {solicitud.fechaFin && format(toDate(solicitud.fechaFin), 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Chip
                            label={`${solicitud.dias} día${solicitud.dias !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              fontWeight: 600,
                              borderRadius: 1
                            }}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Grid>

                  {/* COLUMNA 3: Estado y Acciones */}
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                      <Chip
                        label={solicitud.estado.toUpperCase()}
                        size="small"
                        color={getEstadoColor(solicitud.estado)}
                        sx={{ fontWeight: 600, borderRadius: 1 }}
                      />
                      
                      {/* Acciones */}
                      <Stack direction="row" spacing={0.5}>
                        {/* BOTÓN: Ver Detalles (Siempre visible) */}
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            size="small"
                            sx={{
                              color: theme.palette.info.main,
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) }
                            }}
                            onClick={() => handleOpenDetalles(solicitud)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {solicitud.tipo === 'certificacion' ? (
                          // CERTIFICACIONES: Flujo diferente (Pendiente → Enviado → Recibido)
                          <>
                            {canManageSolicitudes ? (
                              // Admin RRHH para certificaciones
                              <>
                                {solicitud.estado === 'pendiente' && (
                                  <Tooltip title="Subir Certificado (PDF)">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.primary.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                      }}
                                      onClick={() => handleSubirCertificado(solicitud)}
                                      disabled={uploadingCertificado}
                                    >
                                      <UploadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {(solicitud.estado === 'enviado' || solicitud.estado === 'recibido') && solicitud.certificadoURL && (
                                  <Tooltip title="Ver Certificado">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.success.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                                      }}
                                      onClick={() => handleVerCertificado(solicitud)}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    sx={{ 
                                      color: theme.palette.error.main,
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                    }}
                                    onClick={() => handleEliminarSolicitud(solicitud.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              // Usuario para certificaciones
                              <>
                                {(solicitud.estado === 'enviado' || solicitud.estado === 'recibido') && solicitud.certificadoURL && (
                                  <Tooltip title="Ver Certificado">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.info.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) }
                                      }}
                                      onClick={() => handleVerCertificado(solicitud)}
                                    >
                                      <DocumentoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {solicitud.estado === 'pendiente' && (
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.error.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                      }}
                                      onClick={() => handleEliminarSolicitud(solicitud.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {solicitud.estado === 'pendiente' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', px: 1 }}>
                                    Pendiente de envío
                                  </Typography>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          // VACACIONES/PERMISOS: Flujo de aprobación/rechazo
                          <>
                            {canManageSolicitudes ? (
                              // Gestionar: Puede aprobar/rechazar solicitudes de otros
                              <>
                                {solicitud.estado === 'pendiente' && (
                                  <>
                                    <Tooltip title="Aprobar">
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          color: theme.palette.primary.main,
                                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                        }}
                                        onClick={() => handleAprobarSolicitud(solicitud.id)}
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rechazar">
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          color: theme.palette.error.main,
                                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                        }}
                                        onClick={() => handleRechazarSolicitud(solicitud.id)}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    sx={{ 
                                      color: theme.palette.error.main,
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                    }}
                                    onClick={() => handleEliminarSolicitud(solicitud.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              // Usuario normal: Solo puede editar/eliminar sus propias solicitudes pendientes
                              <>
                                {solicitud.estado === 'pendiente' ? (
                                  <>
                                    <Tooltip title="Editar">
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          color: theme.palette.primary.main,
                                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                        }}
                                        onClick={() => handleEditarSolicitud(solicitud)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          color: theme.palette.error.main,
                                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                        }}
                                        onClick={() => handleEliminarSolicitud(solicitud.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', px: 1 }}>
                                    Sin acciones
                                  </Typography>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))
        )}
      </Box>

      {/* PAGINACIÓN */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          mt: 2
        }}
      >
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={solicitudesFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* MODAL: NUEVA SOLICITUD */}
      <Dialog
        open={openSolicitudModal}
        onClose={handleCloseModal}
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
        <DialogTitle sx={{
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'text.primary' }}>
                {editingSolicitudId ? 'Editar Solicitud' : 'Nueva Solicitud'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {editingSolicitudId ? 'Modificar información de la solicitud' : 'Registrar vacaciones, permisos, incapacidades o certificaciones'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
            {/* Tipo de Solicitud */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Solicitud</InputLabel>
                <Select
                  value={formSolicitud.tipo}
                  label="Tipo de Solicitud"
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo: e.target.value })}
                >
                  <MenuItem value="vacaciones">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VacacionesIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                      Vacaciones
                    </Box>
                  </MenuItem>
                  <MenuItem value="permiso">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PermisoIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                      Permiso
                    </Box>
                  </MenuItem>
                  <MenuItem value="incapacidad">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IncapacidadIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                      Incapacidad
                    </Box>
                  </MenuItem>
                  <MenuItem value="compensatorio">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompensatorioIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                      Día Compensatorio
                    </Box>
                  </MenuItem>
                  <MenuItem value="certificacion">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocumentoIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                      Certificación Laboral
                    </Box>
                  </MenuItem>
                  <MenuItem value="licencia_maternidad">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MaternidadIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                      Licencia Maternidad/Paternidad
                    </Box>
                  </MenuItem>
                  <MenuItem value="adelanto">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdelantoIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                      Adelanto de Nómina
                    </Box>
                  </MenuItem>
                  <MenuItem value="remoto">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RemotoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                      Trabajo Remoto (Home Office)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Empleado */}
            <Grid item xs={12}>
              {canManageSolicitudes ? (
                <FormControl fullWidth>
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={formSolicitud.empleadoId}
                    label="Empleado"
                    onChange={(e) => {
                      const emp = empleados.find(emp => emp.id === e.target.value);
                      setFormSolicitud({
                        ...formSolicitud,
                        empleadoId: e.target.value,
                        empleadoNombre: emp?.nombre || ''
                      });
                    }}
                  >
                    {empleados.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          {emp.nombre}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Empleado
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <PersonIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {userProfile?.name || userProfile?.displayName || userProfile?.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>

            {/* Fechas - Solo para tipos que requieren rango de fechas */}
            {!['certificacion', 'adelanto', 'licencia_maternidad'].includes(formSolicitud.tipo) && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Inicio"
                    value={formSolicitud.fechaInicio}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaInicio: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={formSolicitud.tipo === 'incapacidad' ? {} : { min: getTodayDateString() }}
                    helperText={formSolicitud.tipo === 'incapacidad' ? 'Fecha de inicio de la incapacidad' : 'Solo fechas futuras'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Fin"
                    value={formSolicitud.fechaFin}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaFin: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={formSolicitud.tipo === 'incapacidad' ? {} : { min: formSolicitud.fechaInicio || getTodayDateString() }}
                    helperText={formSolicitud.tipo === 'incapacidad' ? 'Fecha de finalización de la incapacidad' : 'Solo fechas futuras'}
                  />
                </Grid>

                {/* Días Calculados - Solo para tipos que NO sean licencia de maternidad */}
                <Grid item xs={12}>
                  <Alert
                    severity="info"
                    icon={<InfoIcon />}
                    sx={{ 
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.info.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                    }}
                  >
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>Días solicitados:</Box> {formSolicitud.dias} día{formSolicitud.dias !== 1 ? 's' : ''}
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}

            {/* Campos específicos para Certificación Laboral */}
            {formSolicitud.tipo === 'certificacion' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="A quién va dirigido"
                    required
                    value={formSolicitud.dirigidoA || ''}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, dirigidoA: e.target.value })}
                    placeholder="Ej: A quien corresponda, Banco XYZ, Notaría..."
                    helperText="Indica la entidad o persona a quien va dirigida la certificación"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha requerida (opcional)"
                    value={formSolicitud.fechaRequerida || ''}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaRequerida: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="¿Para cuándo necesitas la certificación?"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(formSolicitud.incluirSalario)}
                        onChange={(e) => setFormSolicitud({ ...formSolicitud, incluirSalario: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="¿Incluir asignación salarial?"
                    sx={{ 
                      mt: 1,
                      '& .MuiFormControlLabel-label': {
                        fontWeight: 500,
                        color: 'text.primary'
                      }
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Campos específicos para Licencia de Maternidad/Paternidad */}
            {formSolicitud.tipo === 'licencia_maternidad' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Licencia</InputLabel>
                    <Select
                      value={formSolicitud.tipoLicencia || 'maternidad'}
                      label="Tipo de Licencia"
                      onChange={(e) => {
                        const tipo = e.target.value;
                        const dias = tipo === 'maternidad' ? 126 : 14;
                        const fechaNac = formSolicitud.fechaNacimiento;
                        
                        // Para paternidad: fecha inicio = fecha nacimiento (automático)
                        // Para maternidad: fecha inicio se deja en blanco para que usuario la configure
                        let fechaInicio = '';
                        let fechaFin = '';
                        
                        if (tipo === 'paternidad' && fechaNac) {
                          fechaInicio = fechaNac;
                          const fechaFinCalc = new Date(fechaNac + 'T00:00:00');
                          fechaFinCalc.setDate(fechaFinCalc.getDate() + dias);
                          fechaFin = fechaFinCalc.toISOString().split('T')[0];
                        } else if (tipo === 'maternidad' && formSolicitud.fechaInicio) {
                          // Si ya tenía fecha inicio configurada, recalcular fin
                          fechaInicio = formSolicitud.fechaInicio;
                          const fechaFinCalc = new Date(fechaInicio + 'T00:00:00');
                          fechaFinCalc.setDate(fechaFinCalc.getDate() + dias);
                          fechaFin = fechaFinCalc.toISOString().split('T')[0];
                        }
                        
                        setFormSolicitud({ 
                          ...formSolicitud, 
                          tipoLicencia: tipo,
                          fechaInicio: fechaInicio,
                          fechaFin: fechaFin,
                          dias: dias
                        });
                      }}
                    >
                      <MenuItem value="maternidad">Licencia de Maternidad (18 semanas)</MenuItem>
                      <MenuItem value="paternidad">Licencia de Paternidad (2 semanas)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Nacimiento/Adopción"
                    required
                    value={formSolicitud.fechaNacimiento || ''}
                    onChange={(e) => {
                      const fechaNac = e.target.value;
                      const tipo = formSolicitud.tipoLicencia || 'maternidad';
                      const dias = tipo === 'maternidad' ? 126 : 14;
                      
                      let fechaInicio = '';
                      let fechaFin = '';
                      
                      // Para paternidad: fecha inicio automática = fecha nacimiento
                      if (tipo === 'paternidad' && fechaNac) {
                        fechaInicio = fechaNac;
                        const fechaFinCalc = new Date(fechaNac + 'T00:00:00');
                        fechaFinCalc.setDate(fechaFinCalc.getDate() + dias);
                        fechaFin = fechaFinCalc.toISOString().split('T')[0];
                      } else if (tipo === 'maternidad' && formSolicitud.fechaInicio) {
                        // Para maternidad: mantener fecha inicio configurada y recalcular fin
                        fechaInicio = formSolicitud.fechaInicio;
                        const fechaFinCalc = new Date(fechaInicio + 'T00:00:00');
                        fechaFinCalc.setDate(fechaFinCalc.getDate() + dias);
                        fechaFin = fechaFinCalc.toISOString().split('T')[0];
                      }
                      
                      setFormSolicitud({ 
                        ...formSolicitud, 
                        fechaNacimiento: fechaNac,
                        fechaInicio: fechaInicio,
                        fechaFin: fechaFin,
                        dias: dias
                      });
                    }}
                    InputLabelProps={{ shrink: true }}
                    helperText="Fecha estimada o real del nacimiento/adopción"
                  />
                </Grid>
                
                {/* Mostrar campos de fechas según tipo de licencia */}
                {formSolicitud.fechaNacimiento && (
                  <>
                    {/* MATERNIDAD: Fecha Inicio EDITABLE, Fecha Fin CALCULADA */}
                    {formSolicitud.tipoLicencia === 'maternidad' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha Inicio de la Licencia"
                            required
                            value={formSolicitud.fechaInicio || ''}
                            onChange={(e) => {
                              const fechaInicio = e.target.value;
                              let fechaFin = '';
                              
                              if (fechaInicio) {
                                const fechaFinCalc = new Date(fechaInicio + 'T00:00:00');
                                fechaFinCalc.setDate(fechaFinCalc.getDate() + 126);
                                fechaFin = fechaFinCalc.toISOString().split('T')[0];
                              }
                              
                              setFormSolicitud({ 
                                ...formSolicitud, 
                                fechaInicio: fechaInicio,
                                fechaFin: fechaFin
                              });
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: getTodayDateString() }}
                            helperText="Puede iniciar antes del nacimiento por recomendación médica"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha Fin (Calculada Automáticamente)"
                            value={formSolicitud.fechaFin || ''}
                            InputLabelProps={{ shrink: true }}
                            disabled
                            helperText="Se calcula automáticamente: Inicio + 126 días"
                          />
                        </Grid>
                      </>
                    )}
                    
                    {/* PATERNIDAD: Ambas fechas AUTOMÁTICAS desde fecha nacimiento */}
                    {formSolicitud.tipoLicencia === 'paternidad' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha Inicio (Calculada)"
                            value={formSolicitud.fechaInicio || ''}
                            InputLabelProps={{ shrink: true }}
                            disabled
                            helperText="Inicia el día del nacimiento/adopción"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha Fin (Calculada)"
                            value={formSolicitud.fechaFin || ''}
                            InputLabelProps={{ shrink: true }}
                            disabled
                            helperText="Finaliza 14 días después"
                          />
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={12}>
                      <Alert
                        severity="info"
                        icon={<InfoIcon />}
                        sx={{ 
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.info.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700 }}>Duración de la licencia:</Box> {formSolicitud.dias} días ({formSolicitud.tipoLicencia === 'maternidad' ? '18 semanas' : '2 semanas'})
                        </Typography>
                        {formSolicitud.tipoLicencia === 'maternidad' && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            👩‍⚕️ La fecha de inicio puede configurarse según recomendación médica (antes o después del nacimiento)
                          </Typography>
                        )}
                      </Alert>
                    </Grid>
                  </>
                )}
                
                {/* Botones de upload individuales para cada documento */}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                    Documentos Requeridos
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    * Epicrisis, Nacido Vivo e Historia Clínica son obligatorios. Registro Civil es opcional.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* 1. Epicrisis */}
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          border: `2px dashed ${formSolicitud.epicrisisURL ? theme.palette.success.main : theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: formSolicitud.epicrisisURL ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf,image/*';
                          
                          input.onchange = async (e) => {
                            const files = Array.from(e.target.files);
                            if (files.length === 0) return;
                            
                            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
                            if (totalSize > 50 * 1024 * 1024) {
                              showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
                              return;
                            }
                            
                            setUploadingDocLicencia(prev => ({ ...prev, epicrisis: true }));
                            
                            try {
                              const result = await procesarArchivosConValidacionContraseña(files, 'epicrisis');
                              if (!result) throw new Error('Error al procesar archivos');

                              // 🎯 Guardar en memoria (NO subir a Storage aún)
                              setPendingFiles(prev => ({
                                ...prev,
                                epicrisis: result
                              }));
                              
                              setFormSolicitud({
                                ...formSolicitud,
                                epicrisisURL: 'pending',  // Indicador temporal
                                epicrisisNombre: result.stats 
                                  ? `${result.stats.processedFiles} archivo(s) preparado(s)` 
                                  : result.fileName
                              });
                              
                              const mensaje = files.length > 1 
                                ? `${files.length} archivos preparados`
                                : 'Epicrisis preparada';
                              showToast(mensaje, 'success');
                            } catch (error) {
                              console.error('Error al subir epicrisis:', error);
                              showToast(error.message || 'Error al subir el archivo', 'error');
                            } finally {
                              setUploadingDocLicencia(prev => ({ ...prev, epicrisis: false }));
                            }
                          };
                          
                          input.click();
                        }}
                      >
                        {uploadingDocLicencia.epicrisis ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="caption">Subiendo...</Typography>
                          </Box>
                        ) : formSolicitud.epicrisisURL ? (
                          <Box>
                            <CheckIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, mt: 0.5 }}>
                              Epicrisis
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                              {formSolicitud.epicrisisNombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <AttachFileIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Epicrisis
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Clic para adjuntar (uno o más archivos)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* 2. Certificado de Nacido Vivo */}
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          border: `2px dashed ${formSolicitud.nacidoVivoURL ? theme.palette.success.main : theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: formSolicitud.nacidoVivoURL ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf,image/*';
                          
                          input.onchange = async (e) => {
                            const files = Array.from(e.target.files);
                            if (files.length === 0) return;
                            
                            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
                            if (totalSize > 50 * 1024 * 1024) {
                              showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
                              return;
                            }
                            
                            setUploadingDocLicencia(prev => ({ ...prev, nacidoVivo: true }));
                            
                            try {
                              const result = await procesarArchivosConValidacionContraseña(files, 'nacido_vivo');
                              if (!result) throw new Error('Error al procesar archivos');

                              // 🎯 Guardar en memoria (NO subir a Storage aún)
                              setPendingFiles(prev => ({
                                ...prev,
                                nacidoVivo: result
                              }));
                              
                              setFormSolicitud({
                                ...formSolicitud,
                                nacidoVivoURL: 'pending',  // Indicador temporal
                                nacidoVivoNombre: result.stats 
                                  ? `${result.stats.processedFiles} archivo(s) preparado(s)` 
                                  : result.fileName
                              });
                              
                              const mensaje = files.length > 1 
                                ? `${files.length} archivos preparados`
                                : 'Certificado de Nacido Vivo preparado';
                              showToast(mensaje, 'success');
                            } catch (error) {
                              console.error('Error al subir certificado:', error);
                              showToast(error.message || 'Error al subir el archivo', 'error');
                            } finally {
                              setUploadingDocLicencia(prev => ({ ...prev, nacidoVivo: false }));
                            }
                          };
                          
                          input.click();
                        }}
                      >
                        {uploadingDocLicencia.nacidoVivo ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="caption">Subiendo...</Typography>
                          </Box>
                        ) : formSolicitud.nacidoVivoURL ? (
                          <Box>
                            <CheckIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, mt: 0.5 }}>
                              Nacido Vivo
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                              {formSolicitud.nacidoVivoNombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <AttachFileIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Nacido Vivo
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Clic para adjuntar (uno o más archivos)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* 3. Historia Clínica */}
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          border: `2px dashed ${formSolicitud.historiaClinicaURL ? theme.palette.success.main : theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: formSolicitud.historiaClinicaURL ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf,image/*';
                          
                          input.onchange = async (e) => {
                            const files = Array.from(e.target.files);
                            if (files.length === 0) return;
                            
                            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
                            if (totalSize > 50 * 1024 * 1024) {
                              showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
                              return;
                            }
                            
                            setUploadingDocLicencia(prev => ({ ...prev, historiaClinica: true }));
                            
                            try {
                              const result = await procesarArchivosConValidacionContraseña(files, 'historia_clinica');
                              if (!result) throw new Error('Error al procesar archivos');

                              // 🎯 Guardar en memoria (NO subir a Storage aún)
                              setPendingFiles(prev => ({
                                ...prev,
                                historiaClinica: result
                              }));
                              
                              setFormSolicitud({
                                ...formSolicitud,
                                historiaClinicaURL: 'pending',  // Indicador temporal
                                historiaClinicaNombre: result.stats 
                                  ? `${result.stats.processedFiles} archivo(s) preparado(s)` 
                                  : result.fileName
                              });
                              
                              const mensaje = files.length > 1 
                                ? `${files.length} archivos preparados`
                                : 'Historia Clínica preparada';
                              showToast(mensaje, 'success');
                            } catch (error) {
                              console.error('Error al subir historia clínica:', error);
                              showToast(error.message || 'Error al subir el archivo', 'error');
                            } finally {
                              setUploadingDocLicencia(prev => ({ ...prev, historiaClinica: false }));
                            }
                          };
                          
                          input.click();
                        }}
                      >
                        {uploadingDocLicencia.historiaClinica ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="caption">Subiendo...</Typography>
                          </Box>
                        ) : formSolicitud.historiaClinicaURL ? (
                          <Box>
                            <CheckIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, mt: 0.5 }}>
                              Historia Clínica
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                              {formSolicitud.historiaClinicaNombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <AttachFileIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Historia Clínica
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Clic para adjuntar (uno o más archivos)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* 4. Registro Civil */}
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          border: `2px dashed ${formSolicitud.registroCivilURL ? theme.palette.success.main : theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: formSolicitud.registroCivilURL ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf,image/*';
                          
                          input.onchange = async (e) => {
                            const files = Array.from(e.target.files);
                            if (files.length === 0) return;
                            
                            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
                            if (totalSize > 50 * 1024 * 1024) {
                              showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
                              return;
                            }
                            
                            setUploadingDocLicencia(prev => ({ ...prev, registroCivil: true }));
                            
                            try {
                              const result = await procesarArchivosConValidacionContraseña(files, 'registro_civil');
                              if (!result) throw new Error('Error al procesar archivos');

                              // 🎯 Guardar en memoria (NO subir a Storage aún)
                              setPendingFiles(prev => ({
                                ...prev,
                                registroCivil: result
                              }));
                              
                              setFormSolicitud({
                                ...formSolicitud,
                                registroCivilURL: 'pending',  // Indicador temporal
                                registroCivilNombre: result.stats 
                                  ? `${result.stats.processedFiles} archivo(s) preparado(s)` 
                                  : result.fileName
                              });
                              
                              const mensaje = files.length > 1 
                                ? `${files.length} archivos preparados`
                                : 'Registro Civil preparado';
                              showToast(mensaje, 'success');
                            } catch (error) {
                              console.error('Error al subir registro civil:', error);
                              showToast(error.message || 'Error al subir el archivo', 'error');
                            } finally {
                              setUploadingDocLicencia(prev => ({ ...prev, registroCivil: false }));
                            }
                          };
                          
                          input.click();
                        }}
                      >
                        {uploadingDocLicencia.registroCivil ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="caption">Subiendo...</Typography>
                          </Box>
                        ) : formSolicitud.registroCivilURL ? (
                          <Box>
                            <CheckIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, mt: 0.5 }}>
                              Registro Civil
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                              {formSolicitud.registroCivilNombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <AttachFileIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Registro Civil
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Clic para adjuntar (uno o más archivos)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      📋 3 documentos obligatorios (Registro Civil es opcional)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Puedes seleccionar uno o más archivos (PDF o imágenes). Automáticamente se combinarán en un solo PDF.
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}

            {/* Campos específicos para Adelanto de Nómina */}
            {formSolicitud.tipo === 'adelanto' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monto Solicitado"
                    required
                    value={formSolicitud.montoSolicitado || ''}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = rawValue ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(parseInt(rawValue)) : '';
                      setFormSolicitud({ ...formSolicitud, montoSolicitado: formatted });
                    }}
                    placeholder="Ej: $500,000"
                    helperText="Máximo 50% del salario mensual"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Deducción Preferida"
                    required
                    value={formSolicitud.fechaDeduccion || ''}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaDeduccion: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="¿En qué quincena deseas que se descuente?"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ borderRadius: 1 }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>Importante:</Box> El monto será descontado según la fecha indicada. Verifica tu disponibilidad presupuestal.
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}

            {/* Campos específicos para Trabajo Remoto */}
            {formSolicitud.tipo === 'remoto' && (
              <>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(formSolicitud.confirmaRecursos)}
                        onChange={(e) => setFormSolicitud({ ...formSolicitud, confirmaRecursos: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Confirmo que cuento con internet estable, equipo de cómputo y espacio adecuado para trabajar desde casa"
                    sx={{ 
                      '& .MuiFormControlLabel-label': {
                        fontWeight: 500,
                        color: 'text.primary'
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 1 }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>Recuerda:</Box> Debes mantener la misma disponibilidad y productividad que en oficina. Se requiere conexión estable a internet y herramientas de comunicación.
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}


            {/* Motivo */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                required={formSolicitud.tipo === 'certificacion'}
                label={
                  formSolicitud.tipo === 'certificacion' ? 'Tipo de certificación' :
                  'Motivo (opcional)'
                }
                value={formSolicitud.motivo || ''}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
                placeholder={
                  formSolicitud.tipo === 'certificacion' 
                    ? 'Ej: Certificación laboral, certificación de ingresos, constancia de trabajo...'
                    : 'Describe el motivo de la solicitud...'
                }
                helperText={
                  formSolicitud.tipo === 'certificacion' ? 'Especifica qué tipo de certificación necesitas' : ''
                }
              />
            </Grid>

            {/* Campos específicos para Incapacidad */}
            {formSolicitud.tipo === 'incapacidad' && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: `2px dashed ${formSolicitud.incapacidadURL ? theme.palette.success.main : theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: formSolicitud.incapacidadURL ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;  // Permitir múltiples archivos
                    input.accept = '.pdf,image/*';
                    
                    input.onchange = async (e) => {
                      const files = Array.from(e.target.files);
                      if (files.length === 0) return;
                      
                      // Validar tamaño total antes de procesamiento
                      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
                      if (totalSize > 50 * 1024 * 1024) {
                        showToast('El tamaño total de archivos no debe superar 50MB', 'warning');
                        return;
                      }
                      
                      setUploadingIncapacidad(true);
                      
                      try {
                        // Procesar y combinar archivos (con validación de contraseñas)
                        const result = await procesarArchivosConValidacionContraseña(files, 'incapacidad');
                        if (!result) throw new Error('Error al procesar archivos');

                        // 🎯 Guardar en memoria (NO subir a Storage aún)
                        setPendingFiles(prev => ({
                          ...prev,
                          incapacidad: result
                        }));
                        
                        // Marcar como preparado en el formulario
                        setFormSolicitud({
                          ...formSolicitud,
                          incapacidadURL: 'pending',  // Indicador temporal
                          incapacidadNombre: result.stats 
                            ? `${result.stats.processedFiles} archivo(s) preparado(s)` 
                            : result.fileName
                        });
                        
                        const mensaje = files.length > 1 
                          ? `${files.length} archivos preparados (se subirán al crear la solicitud)`
                          : 'Incapacidad preparada (se subirá al crear la solicitud)';
                        showToast(mensaje, 'success');
                      } catch (error) {
                        console.error('Error al procesar incapacidad:', error);
                        showToast(error.message || 'Error al procesar el archivo', 'error');
                      } finally {
                        setUploadingIncapacidad(false);
                      }
                    };
                    
                    input.click();
                  }}
                >
                  {uploadingIncapacidad ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Subiendo archivo...</Typography>
                    </Box>
                  ) : formSolicitud.incapacidadURL ? (
                    <Box>
                      <CheckIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, mt: 0.5 }}>
                        Incapacidad Adjunta
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                        {formSolicitud.incapacidadNombre}
                      </Typography>
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormSolicitud({ ...formSolicitud, incapacidadURL: '', incapacidadNombre: '' });
                        }}
                      >
                        Cambiar archivo
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <AttachFileIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Adjuntar Incapacidad Médica *
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Clic para adjuntar (uno o más archivos)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
            </Grid>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: 1,
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCrearSolicitud}
            startIcon={<CheckIcon />}
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              backgroundColor: theme.palette.success.main,
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              '&:hover': {
                backgroundColor: theme.palette.success.dark,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            {editingSolicitudId ? 'Actualizar Solicitud' : 'Crear Solicitud'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN - Aprobar/Rechazar con Comentarios */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `1px solid ${alpha(
              confirmAction === 'aprobar' ? theme.palette.primary.main : theme.palette.error.main, 
              0.6
            )}`
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: confirmAction === 'aprobar' 
                  ? 'primary.main' 
                  : 'error.main',
                color: 'white'
              }}
            >
              {confirmAction === 'aprobar' ? <CheckIcon /> : <CloseIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'text.primary' }}>
                {confirmAction === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {confirmAction === 'aprobar' 
                  ? 'Agrega un comentario opcional' 
                  : 'Debes especificar el motivo del rechazo'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={confirmAction === 'aprobar' ? 'Comentario (Opcional)' : 'Motivo del Rechazo *'}
            value={comentarioAccion}
            onChange={(e) => setComentarioAccion(e.target.value)}
            placeholder={
              confirmAction === 'aprobar'
                ? 'Ej: Aprobado según disponibilidad del equipo...'
                : 'Ej: No hay cobertura disponible, requiere más antigüedad...'
            }
            required={confirmAction === 'rechazar'}
            error={confirmAction === 'rechazar' && !comentarioAccion}
            helperText={
              confirmAction === 'rechazar' && !comentarioAccion 
                ? 'El motivo del rechazo es obligatorio'
                : ''
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseConfirmDialog}
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: 1,
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: confirmAction === 'aprobar' 
                ? theme.palette.primary.main 
                : theme.palette.error.main,
              color: '#fff',
              '&:hover': {
                bgcolor: confirmAction === 'aprobar' 
                  ? theme.palette.primary.dark 
                  : theme.palette.error.dark
              }
            }}
          >
            {confirmAction === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: DETALLES DE SOLICITUD */}
      <Dialog
        open={openDetallesModal}
        onClose={handleCloseDetalles}
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
          pb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2.5}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Avatar sx={{
                  bgcolor: 'primary.main',
                  width: 48,
                  height: 48
                }}>
                  {selectedSolicitud && getTipoIcon(selectedSolicitud.tipo)}
                </Avatar>
              </motion.div>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {selectedSolicitud && getTipoLabel(selectedSolicitud.tipo)}
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Chip
                    label={(selectedSolicitud?.estado || 'pendiente').toUpperCase()}
                    color={getEstadoColor(selectedSolicitud?.estado || 'pendiente')}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Solicitada: {selectedSolicitud && format(toDate(selectedSolicitud.fechaSolicitud), 'dd MMM yyyy', { locale: es })}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDetalles} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedSolicitud && (
            <Stack spacing={3}>
              {/* INFORMACIÓN DEL EMPLEADO */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  background: alpha(theme.palette.primary.main, 0.02)
                }}
              >
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontWeight: 600,
                  display: 'block',
                  mb: 1.5
                }}>
                  📋 Información del Empleado
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body1" fontWeight={500}>
                    {selectedSolicitud.empleadoNombre}
                  </Typography>
                </Box>
              </Paper>

              {/* FECHAS (según tipo de solicitud) */}
              {(selectedSolicitud.tipo !== 'certificacion' && selectedSolicitud.tipo !== 'adelanto') && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 2
                  }}>
                    📅 Fechas
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedSolicitud.fechaInicio && (
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Fecha Inicio
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {format(toDate(selectedSolicitud.fechaInicio), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Grid>
                    )}
                    {selectedSolicitud.fechaFin && (
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Fecha Fin
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {format(toDate(selectedSolicitud.fechaFin), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Grid>
                    )}
                    {selectedSolicitud.dias > 0 && (
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Duración
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedSolicitud.dias} {selectedSolicitud.dias === 1 ? 'día' : 'días'}
                        </Typography>
                      </Grid>
                    )}
                    {selectedSolicitud.fechaNacimiento && (
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Fecha Nacimiento
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {format(toDate(selectedSolicitud.fechaNacimiento), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}

              {/* INFORMACIÓN ESPECÍFICA SEGÚN TIPO */}
              {selectedSolicitud.tipo === 'licencia_maternidad' && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 1.5
                  }}>
                    👶 Tipo de Licencia
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedSolicitud.tipoLicencia === 'maternidad' ? 'Maternidad (18 semanas)' : 'Paternidad (2 semanas)'}
                  </Typography>
                </Paper>
              )}

              {selectedSolicitud.tipo === 'adelanto' && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: alpha(theme.palette.success.main, 0.02)
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 2
                  }}>
                    💰 Información del Adelanto
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Monto Solicitado
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={600} color="success.main">
                        ${new Intl.NumberFormat('es-CO').format(selectedSolicitud.montoSolicitado)}
                      </Typography>
                    </Grid>
                    {selectedSolicitud.fechaDeduccion && (
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Fecha Deducción
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {format(toDate(selectedSolicitud.fechaDeduccion), 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}

              {selectedSolicitud.tipo === 'certificacion' && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 1.5
                  }}>
                    📄 Dirigido A
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedSolicitud.dirigidoA || 'No especificado'}
                  </Typography>
                  <Box mt={1.5}>
                    <FormControlLabel
                      control={<Checkbox checked={selectedSolicitud.incluirSalario || false} disabled />}
                      label="Incluir información salarial"
                    />
                  </Box>
                  {selectedSolicitud.fechaRequerida && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Fecha requerida
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {format(toDate(selectedSolicitud.fechaRequerida), 'dd MMM yyyy', { locale: es })}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              {/* MOTIVO */}
              {selectedSolicitud.motivo && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 1.5
                  }}>
                    📝 Motivo / Descripción
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedSolicitud.motivo}
                  </Typography>
                </Paper>
              )}

              {/* DOCUMENTOS ADJUNTOS */}
              {(selectedSolicitud.certificadoURL || 
                selectedSolicitud.incapacidadURL || 
                selectedSolicitud.epicrisisURL || 
                selectedSolicitud.nacidoVivoURL || 
                selectedSolicitud.historiaClinicaURL || 
                selectedSolicitud.registroCivilURL) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: alpha(theme.palette.info.main, 0.02)
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 2
                  }}>
                    📎 Documentos Adjuntos
                  </Typography>
                  <Stack spacing={1.5}>
                    {selectedSolicitud.certificadoURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.certificadoURL, selectedSolicitud.certificadoNombre || 'Certificado Laboral')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            📄 {selectedSolicitud.certificadoNombre || 'Certificado Laboral'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar
                          </Typography>
                        </Box>
                      </Button>
                    )}
                    {selectedSolicitud.incapacidadURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.incapacidadURL, selectedSolicitud.incapacidadNombre || 'Incapacidad Médica')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            🏥 {selectedSolicitud.incapacidadNombre || 'Incapacidad Médica'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar
                          </Typography>
                        </Box>
                      </Button>
                    )}
                    {selectedSolicitud.epicrisisURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.epicrisisURL, selectedSolicitud.epicrisisNombre || 'Epicrisis')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            📋 {selectedSolicitud.epicrisisNombre || 'Epicrisis'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar
                          </Typography>
                        </Box>
                      </Button>
                    )}
                    {selectedSolicitud.nacidoVivoURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.nacidoVivoURL, selectedSolicitud.nacidoVivoNombre || 'Certificado de Nacido Vivo')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            👶 {selectedSolicitud.nacidoVivoNombre || 'Certificado de Nacido Vivo'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar
                          </Typography>
                        </Box>
                      </Button>
                    )}
                    {selectedSolicitud.historiaClinicaURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.historiaClinicaURL, selectedSolicitud.historiaClinicaNombre || 'Historia Clínica')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            📑 {selectedSolicitud.historiaClinicaNombre || 'Historia Clínica'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar
                          </Typography>
                        </Box>
                      </Button>
                    )}
                    {selectedSolicitud.registroCivilURL && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenPDF(selectedSolicitud.registroCivilURL, selectedSolicitud.registroCivilNombre || 'Registro Civil')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 1,
                          textTransform: 'none',
                          py: 1.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={500}>
                            📜 {selectedSolicitud.registroCivilNombre || 'Registro Civil'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Click para visualizar (Opcional)
                          </Typography>
                        </Box>
                      </Button>
                    )}
                  </Stack>
                </Paper>
              )}

              {/* INFORMACIÓN DE APROBACIÓN/RECHAZO */}
              {(selectedSolicitud.estado === 'aprobada' || selectedSolicitud.estado === 'rechazada') && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: selectedSolicitud.estado === 'aprobada' 
                      ? alpha(theme.palette.success.main, 0.04)
                      : alpha(theme.palette.error.main, 0.04)
                  }}
                >
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    display: 'block',
                    mb: 2
                  }}>
                    {selectedSolicitud.estado === 'aprobada' ? '✅ Aprobación' : '❌ Rechazo'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedSolicitud.estado === 'aprobada' ? 'Aprobada por' : 'Rechazada por'}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedSolicitud.aprobadoPorNombre || selectedSolicitud.rechazadoPorNombre || 'Sistema'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Fecha
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedSolicitud.fechaAprobacion 
                          ? format(toDate(selectedSolicitud.fechaAprobacion), 'dd MMM yyyy HH:mm', { locale: es })
                          : selectedSolicitud.fechaRechazo
                          ? format(toDate(selectedSolicitud.fechaRechazo), 'dd MMM yyyy HH:mm', { locale: es })
                          : 'N/A'
                        }
                      </Typography>
                    </Grid>
                  </Grid>
                  {selectedSolicitud.comentarioAprobacion && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Comentario
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedSolicitud.comentarioAprobacion}
                      </Typography>
                    </Box>
                  )}
                  {selectedSolicitud.motivoRechazo && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Motivo del rechazo
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedSolicitud.motivoRechazo}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseDetalles}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: VISOR PDF */}
      <Dialog
        open={openPDFViewer}
        onClose={handleClosePDF}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          p: 3,
          pb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2.5}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Avatar sx={{
                  bgcolor: 'primary.main',
                  width: 40,
                  height: 40
                }}>
                  <InsertDriveFileIcon />
                </Avatar>
              </motion.div>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentPDF.nombre}
                </Typography>
                {documentInfo && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDocumentType(documentInfo.tipo)} • {formatFileSize(documentInfo.tamano)}
                    </Typography>
                    {documentInfo.fechaSubida && (
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(documentInfo.fechaSubida), 'dd MMM yyyy', { locale: es })}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Información del documento">
                <IconButton
                  onClick={handleToggleDocumentInfo}
                  sx={{
                    color: theme.palette.text.primary,
                    background: documentInfoOpen
                      ? alpha(theme.palette.info.main, 0.15)
                      : alpha(theme.palette.info.main, 0.08),
                    '&:hover': {
                      background: alpha(theme.palette.info.main, 0.2),
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <InfoIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Descargar">
                <IconButton
                  component="a"
                  href={currentPDF.url}
                  download={currentPDF.nombre}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: theme.palette.text.primary,
                    background: alpha(theme.palette.success.main, 0.08),
                    '&:hover': {
                      background: alpha(theme.palette.success.main, 0.15),
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <GetAppIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleClosePDF} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {/* PANEL INFORMACIÓN EXPANDIBLE */}
        {documentInfo && documentInfoOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <Box sx={{
              px: 3,
              py: 2,
              background: alpha(theme.palette.info.main, 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              maxHeight: '40vh',
              overflowY: 'auto'
            }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2
              }}>
                <Box display="flex" alignItems="start" gap={1}>
                  <FolderOpenIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Ubicación
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: theme.palette.text.primary,
                      fontSize: '0.8rem',
                      wordBreak: 'break-word'
                    }}>
                      {documentInfo.path || 'Firebase Storage'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="start" gap={1}>
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Tipo
                    </Typography>
                    <Typography variant="body2">
                      {formatDocumentType(documentInfo.tipo)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="start" gap={1}>
                  <AttachFileIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Tamaño
                    </Typography>
                    <Typography variant="body2">
                      {formatFileSize(documentInfo.tamano)}
                    </Typography>
                  </Box>
                </Box>

                {documentInfo.fechaSubida && (
                  <Box display="flex" alignItems="start" gap={1}>
                    <CalendarIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        Fecha de subida
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(documentInfo.fechaSubida), 'dd MMM yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
        )}

        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {pdfViewerLoading ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              component="iframe"
              src={currentPDF.url}
              sx={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONTRASEÑA DE PDF */}
      <Dialog
        open={openPasswordModal}
        onClose={handleCancelarPassword}
        maxWidth="sm"
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
          pb: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              width: 48,
              height: 48
            }}>
              <InfoIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🔒 PDF Protegido con Contraseña
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este documento requiere contraseña para continuar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Alert 
            severity={passwordAttempts >= 3 ? "error" : "warning"} 
            sx={{ mt: 3, mb: 3, borderRadius: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              {passwordAttempts >= 3 
                ? "⚠️ 3 intentos fallidos - Opciones disponibles"
                : "El PDF que intentas subir está protegido con contraseña"
              }
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              {passwordAttempts >= 3 
                ? "Es posible que: 1) La contraseña sea incorrecta, 2) El PDF use encriptación no soportada. Puedes cancelar y desencriptar el PDF con otra herramienta (Adobe, PDFtk), o subir el archivo encriptado (puede causar problemas al visualizarlo)."
                : "Por seguridad, necesitamos desencriptar el documento antes de subirlo al sistema. Ingresa la contraseña para continuar."
              }
            </Typography>
          </Alert>

          <TextField
            fullWidth
            type="password"
            label="Contraseña del PDF"
            value={pdfPassword}
            onChange={(e) => setPdfPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmarPassword();
              }
            }}
            error={!!passwordError}
            helperText={passwordError || `Intento ${passwordAttempts + 1} de 3`}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />

          {pendingPasswordFile?.file && (
            <Box sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              background: alpha(theme.palette.info.main, 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Archivo:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                📄 {pendingPasswordFile.file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(pendingPasswordFile.file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={handleCancelarPassword}
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: 1,
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancelar
          </Button>
          
          {/* Botón de emergencia: Subir encriptado (solo después de 3 intentos) */}
          {passwordAttempts >= 3 && (
            <Button
              onClick={handleSubirEncriptado}
              variant="outlined"
              color="warning"
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                px: 3
              }}
            >
              ⚠️ Subir Encriptado
            </Button>
          )}
          
          <Button
            onClick={handleConfirmarPassword}
            variant="contained"
            disabled={!pdfPassword.trim() || passwordAttempts >= 3}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: theme.palette.warning.main,
              color: '#fff',
              '&:hover': {
                bgcolor: theme.palette.warning.dark
              }
            }}
          >
            Desencriptar y Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modales de generación/preview eliminados - ahora se usa upload directo */}
    </motion.div>
  );
};

export default SolicitudesRRHH;
