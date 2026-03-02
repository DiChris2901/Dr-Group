import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Fab,
  alpha,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  WhatsApp as WhatsAppIcon,
  Info as InfoIcon,
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
  InsertDriveFile as FileIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  CreditCard as CardIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  LocalHospital as LocalHospitalIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/permissions';
import useActivityLogs from '../hooks/useActivityLogs';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import PageSkeleton from '../components/common/PageSkeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import EmpleadoForm, { NIVELES_RIESGO_ARL } from '../components/rrhh/EmpleadoForm';
const EmpleadosPage = ({ embedded = false, empleadosExternal = null }) => {
  const { currentUser, userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const theme = useTheme();
  const isAdmin = isAdminUser(currentUser, userProfile);
  
  const [empleados, setEmpleados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulario para nuevo empleado
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    nacionalidad: 'Colombiana',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    emailCorporativo: '',
    telefono: '',
    edad: '',
    fechaNacimiento: '',
    empresaContratante: '',
    contratoURL: '',
    fechaInicioContrato: '',
    tipoVigencia: 'Trimestral',
    fechaFinContrato: '',
    seRenueva: false,
    banco: '',
    tipoCuenta: 'Ahorros',
    numeroCuenta: '',
    certificadoBancarioURL: '',
    documentoIdentidadURL: '',
    retirado: false,
    fechaRetiro: '',
    motivoRetiro: '',
    // Información de Nómina
    salarioBase: '',
    cargo: '',
    tipoNomina: 'mensual',
    // Seguridad Social
    eps: '',
    fondoPension: '',
    fondoCesantias: '',
    arl: '',
    nivelRiesgoArl: 'I',
    cajaCompensacion: ''
  });

  const [contratoFile, setContratoFile] = useState(null);
  const [uploadingContrato, setUploadingContrato] = useState(false);
  const [certificadoFile, setCertificadoFile] = useState(null);
  const [uploadingCertificado, setUploadingCertificado] = useState(false);
  const [documentoIdentidadFile, setDocumentoIdentidadFile] = useState(null);
  const [uploadingDocumentoIdentidad, setUploadingDocumentoIdentidad] = useState(false);

  // Estados para Drag & Drop
  const [dragOverDocumento, setDragOverDocumento] = useState(false);
  const [dragOverContrato, setDragOverContrato] = useState(false);
  const [dragOverCertificado, setDragOverCertificado] = useState(false);

  // Estados para Modal PDF Viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');

  // Cargar empleados desde Firestore (se omite si el padre provee empleadosExternal)
  useEffect(() => {
    if (!currentUser || empleadosExternal !== null) return;

    const q = query(
      collection(db, 'empleados'),
      orderBy('apellidos', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const empleadosData = [];
        snapshot.forEach((doc) => {
          empleadosData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setEmpleados(empleadosData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar empleados:', error);
        setError(error.message);
        setLoading(false);
        addNotification('Error al cargar empleados', 'error');
      }
    );

    return () => unsubscribe();
  }, [currentUser, addNotification, empleadosExternal]);

  // Sincronizar datos externos cuando el padre los actualiza
  useEffect(() => {
    if (empleadosExternal !== null) {
      setEmpleados(empleadosExternal);
      setLoading(false);
    }
  }, [empleadosExternal]);

  // Cargar empresas desde Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const empresasData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          empresasData.push({
            id: doc.id,
            name: data.name,
            logoURL: data.logoURL || ''
          });
        });
        setEmpresas(empresasData);
      },
      (error) => {
        console.error('Error al cargar empresas:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Calcular edad desde fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Calcular tiempo en la empresa
  const calcularTiempoEnEmpresa = (fechaInicioContrato, fechaRetiro = null) => {
    if (!fechaInicioContrato) return 'No disponible';
    
    const [year, month, day] = fechaInicioContrato.split('-').map(Number);
    const fechaInicio = new Date(year, month - 1, day);
    
    // Si hay fecha de retiro, calcular hasta esa fecha, sino hasta hoy
    let fechaFin;
    if (fechaRetiro) {
      const [yearRetiro, monthRetiro, dayRetiro] = fechaRetiro.split('-').map(Number);
      fechaFin = new Date(yearRetiro, monthRetiro - 1, dayRetiro);
    } else {
      fechaFin = new Date();
    }
    
    let años = fechaFin.getFullYear() - fechaInicio.getFullYear();
    let meses = fechaFin.getMonth() - fechaInicio.getMonth();
    
    if (meses < 0) {
      años--;
      meses += 12;
    }
    
    if (años > 0 && meses > 0) {
      return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
    } else if (años > 0) {
      return `${años} año${años > 1 ? 's' : ''}`;
    } else if (meses > 0) {
      return `${meses} mes${meses > 1 ? 'es' : ''}`;
    } else {
      return 'Menos de 1 mes';
    }
  };

  // Calcular fecha fin de contrato según tipo de vigencia (con renovación automática)
  const calcularFechaFinContrato = (fechaInicio, tipoVigencia) => {
    if (!fechaInicio || tipoVigencia === 'Indefinido') return '';
    
    // Parsear fecha como local (no UTC) para evitar problemas de zona horaria
    const [year, month, day] = fechaInicio.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const hoy = new Date();
    
    // Determinar meses a sumar según vigencia
    let mesesVigencia = 0;
    switch (tipoVigencia) {
      case 'Trimestral':
        mesesVigencia = 3;
        break;
      case 'Semestral':
        mesesVigencia = 6;
        break;
      case 'Anual':
        mesesVigencia = 12;
        break;
      default:
        return '';
    }
    
    // Sumar períodos hasta que la fecha sea futura
    while (fecha <= hoy) {
      fecha.setMonth(fecha.getMonth() + mesesVigencia);
    }
    
    // Formatear como YYYY-MM-DD para input type="date"
    const yearFin = fecha.getFullYear();
    const monthFin = String(fecha.getMonth() + 1).padStart(2, '0');
    const dayFin = String(fecha.getDate()).padStart(2, '0');
    return `${yearFin}-${monthFin}-${dayFin}`;
  };

  // Calcular siguiente renovación (un período después de la fecha fin)
  const calcularSiguienteRenovacion = (fechaInicio, tipoVigencia) => {
    if (!fechaInicio || tipoVigencia === 'Indefinido') return '';
    
    const fechaFin = calcularFechaFinContrato(fechaInicio, tipoVigencia);
    if (!fechaFin) return '';
    
    const [year, month, day] = fechaFin.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    
    // Determinar meses a sumar según vigencia
    let mesesVigencia = 0;
    switch (tipoVigencia) {
      case 'Trimestral':
        mesesVigencia = 3;
        break;
      case 'Semestral':
        mesesVigencia = 6;
        break;
      case 'Anual':
        mesesVigencia = 12;
        break;
      default:
        return '';
    }
    
    // Sumar un período más
    fecha.setMonth(fecha.getMonth() + mesesVigencia);
    
    // Formatear como YYYY-MM-DD
    const yearRen = fecha.getFullYear();
    const monthRen = String(fecha.getMonth() + 1).padStart(2, '0');
    const dayRen = String(fecha.getDate()).padStart(2, '0');
    return `${yearRen}-${monthRen}-${dayRen}`;
  };

  // Formatear número con puntos de miles
  const formatearNumeroDocumento = (valor) => {
    // Remover todo excepto números
    const soloNumeros = valor.replace(/\D/g, '');
    
    // Formatear con puntos de miles
    return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Manejar cambios en formulario
  const handleFormChange = (field, value) => {
    // Si es el campo de número de documento, formatear con puntos
    if (field === 'numeroDocumento') {
      const numeroFormateado = formatearNumeroDocumento(value);
      setFormData(prev => ({
        ...prev,
        [field]: numeroFormateado
      }));
      return;
    }

    // Formatear salario con separador de miles
    if (field === 'salarioBase') {
      const salarioFormateado = formatearNumeroDocumento(value);
      setFormData(prev => ({
        ...prev,
        [field]: salarioFormateado
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calcular edad cuando se cambia fecha de nacimiento
    if (field === 'fechaNacimiento') {
      const edad = calcularEdad(value);
      setFormData(prev => ({
        ...prev,
        edad: edad
      }));
    }

    // Auto-calcular fecha fin cuando se cambia fecha inicio o tipo de vigencia
    if (field === 'fechaInicioContrato') {
      const fechaFin = calcularFechaFinContrato(value, formData.tipoVigencia);
      setFormData(prev => ({
        ...prev,
        fechaFinContrato: fechaFin
      }));
    }

    if (field === 'tipoVigencia') {
      if (value === 'Indefinido') {
        // Si es indefinido, limpiar fecha fin y renovación
        setFormData(prev => ({
          ...prev,
          fechaFinContrato: '',
          seRenueva: false
        }));
      } else {
        // Calcular nueva fecha fin con la vigencia seleccionada
        const fechaFin = calcularFechaFinContrato(formData.fechaInicioContrato, value);
        setFormData(prev => ({
          ...prev,
          fechaFinContrato: fechaFin
        }));
      }
    }
  };

  // Funciones para Drag & Drop
  const handleDragOver = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'documento') setDragOverDocumento(true);
    if (type === 'contrato') setDragOverContrato(true);
    if (type === 'certificado') setDragOverCertificado(true);
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'documento') setDragOverDocumento(false);
    if (type === 'contrato') setDragOverContrato(false);
    if (type === 'certificado') setDragOverCertificado(false);
  };

  const handleDrop = (e, type, acceptedTypes) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'documento') setDragOverDocumento(false);
    if (type === 'contrato') setDragOverContrato(false);
    if (type === 'certificado') setDragOverCertificado(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validar tipo de archivo
      const isValidType = acceptedTypes.some(type => {
        if (type === 'application/pdf') return file.type === 'application/pdf';
        if (type === 'image/*') return file.type.startsWith('image/');
        return false;
      });

      if (!isValidType) {
        alert('Tipo de archivo no permitido. Por favor, selecciona un archivo válido.');
        return;
      }

      // Asignar archivo según el tipo
      if (type === 'documento') setDocumentoIdentidadFile(file);
      if (type === 'contrato') setContratoFile(file);
      if (type === 'certificado') setCertificadoFile(file);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      nacionalidad: 'Colombiana',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      emailCorporativo: '',
      telefono: '',
      edad: '',
      fechaNacimiento: '',
      contratoURL: '',
      fechaInicioContrato: '',
      tipoVigencia: 'Trimestral',
      fechaFinContrato: '',
      seRenueva: false,
      banco: '',
      tipoCuenta: 'Ahorros',
      numeroCuenta: '',
      certificadoBancarioURL: '',
      documentoIdentidadURL: '',
      salarioBase: '',
      cargo: '',
      tipoNomina: 'mensual',
      eps: '',
      fondoPension: '',
      fondoCesantias: '',
      arl: '',
      nivelRiesgoArl: 'I',
      cajaCompensacion: ''
    });
    setContratoFile(null);
    setCertificadoFile(null);
    setDocumentoIdentidadFile(null);
  };

  // Subir archivo a Firebase Storage
  const uploadFile = async (file, folder, empleadoId) => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `empleados/${empleadoId}/${folder}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  };

  // Eliminar archivo de Firebase Storage
  const deleteFileFromStorage = async (fileURL) => {
    try {
      if (!fileURL) return;
      
      // Crear referencia desde la URL
      const fileRef = ref(storage, fileURL);
      await deleteObject(fileRef);
    } catch (error) {
      // Si el archivo no existe (404), no es un error crítico
      if (error.code === 'storage/object-not-found') {
      } else {
        console.error('Error al eliminar archivo de Storage:', error);
        throw error;
      }
    }
  };

  // Agregar nuevo empleado
  const handleAddEmpleado = async () => {
    try {
      // Validaciones
      if (!formData.nombres || !formData.apellidos || !formData.numeroDocumento) {
        addNotification('Por favor completa los campos obligatorios', 'error');
        return;
      }

      setSaving(true);

      // Remover puntos del número de documento antes de guardar
      const numeroDocumentoSinPuntos = formData.numeroDocumento.replace(/\./g, '');

      // Crear documento en Firestore primero
      const docRef = await addDoc(collection(db, 'empleados'), {
        ...formData,
        numeroDocumento: numeroDocumentoSinPuntos,
        salarioBase: parseInt(formData.salarioBase.replace(/\./g, '')) || 0,
        edad: parseInt(formData.edad) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid
      });

      // Subir archivos si existen
      let contratoURL = formData.contratoURL;
      let certificadoURL = formData.certificadoBancarioURL;
      let documentoIdentidadURL = formData.documentoIdentidadURL;

      if (contratoFile) {
        setUploadingContrato(true);
        contratoURL = await uploadFile(contratoFile, 'contratos', docRef.id);
      }

      if (certificadoFile) {
        setUploadingCertificado(true);
        certificadoURL = await uploadFile(certificadoFile, 'certificados', docRef.id);
      }

      if (documentoIdentidadFile) {
        setUploadingDocumentoIdentidad(true);
        documentoIdentidadURL = await uploadFile(documentoIdentidadFile, 'documentos-identidad', docRef.id);
      }

      // Actualizar URLs de archivos si se subieron
      if (contratoURL !== formData.contratoURL || certificadoURL !== formData.certificadoBancarioURL || documentoIdentidadURL !== formData.documentoIdentidadURL) {
        await updateDoc(doc(db, 'empleados', docRef.id), {
          contratoURL: contratoURL,
          certificadoBancarioURL: certificadoURL,
          documentoIdentidadURL: documentoIdentidadURL,
          updatedAt: serverTimestamp()
        });
      }

      // Log de auditoría
      await logActivity(
        'create',
        'empleado',
        docRef.id,
        { nombres: formData.nombres, apellidos: formData.apellidos, numeroDocumento: formData.numeroDocumento },
        currentUser.uid,
        userProfile?.name || userProfile?.displayName || 'Usuario desconocido',
        currentUser.email
      );

      addNotification('Empleado agregado exitosamente', 'success');
      setAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error al agregar empleado:', error);
      addNotification('Error al agregar empleado: ' + error.message, 'error');
    } finally {
      setSaving(false);
      setUploadingContrato(false);
      setUploadingCertificado(false);
      setUploadingDocumentoIdentidad(false);
    }
  };

  // Editar empleado existente
  const handleEditEmpleado = async () => {
    try {
      if (!selectedEmpleado) return;

      setSaving(true);

      let contratoURL = formData.contratoURL;
      let certificadoURL = formData.certificadoBancarioURL;
      let documentoIdentidadURL = formData.documentoIdentidadURL;

      // Subir nuevos archivos si se seleccionaron (eliminando el anterior primero)
      if (contratoFile) {
        setUploadingContrato(true);
        // Eliminar archivo anterior si existe
        if (selectedEmpleado.contratoURL) {
          await deleteFileFromStorage(selectedEmpleado.contratoURL);
        }
        contratoURL = await uploadFile(contratoFile, 'contratos', selectedEmpleado.id);
      }

      if (certificadoFile) {
        setUploadingCertificado(true);
        // Eliminar archivo anterior si existe
        if (selectedEmpleado.certificadoBancarioURL) {
          await deleteFileFromStorage(selectedEmpleado.certificadoBancarioURL);
        }
        certificadoURL = await uploadFile(certificadoFile, 'certificados', selectedEmpleado.id);
      }

      if (documentoIdentidadFile) {
        setUploadingDocumentoIdentidad(true);
        // Eliminar archivo anterior si existe
        if (selectedEmpleado.documentoIdentidadURL) {
          await deleteFileFromStorage(selectedEmpleado.documentoIdentidadURL);
        }
        documentoIdentidadURL = await uploadFile(documentoIdentidadFile, 'documentos-identidad', selectedEmpleado.id);
      }

      // Remover puntos del número de documento antes de guardar
      const numeroDocumentoSinPuntos = formData.numeroDocumento.replace(/\./g, '');

      // Actualizar documento
      await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
        ...formData,
        numeroDocumento: numeroDocumentoSinPuntos,
        salarioBase: parseInt(formData.salarioBase.replace(/\./g, '')) || 0,
        edad: parseInt(formData.edad) || 0,
        contratoURL: contratoURL,
        certificadoBancarioURL: certificadoURL,
        documentoIdentidadURL: documentoIdentidadURL,
        updatedAt: serverTimestamp()
      });

      // Log de auditoría
      await logActivity(
        'update',
        'empleado',
        selectedEmpleado.id,
        { ...formData, numeroDocumento: numeroDocumentoSinPuntos },
        currentUser.uid,
        userProfile?.name || userProfile?.displayName || 'Usuario desconocido',
        currentUser.email
      );

      addNotification('Empleado actualizado exitosamente', 'success');
      setEditDialogOpen(false);
      resetForm();
      setSelectedEmpleado(null);
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      addNotification('Error al actualizar empleado: ' + error.message, 'error');
    } finally {
      setSaving(false);
      setUploadingContrato(false);
      setUploadingCertificado(false);
      setUploadingDocumentoIdentidad(false);
    }
  };

  // Eliminar empleado
  const handleDeleteEmpleado = async () => {
    try {
      if (!selectedEmpleado) return;

      setSaving(true);

      // Eliminar archivos adjuntos de Storage
      const filesToDelete = [
        selectedEmpleado.documentoIdentidadURL,
        selectedEmpleado.contratoURL,
        selectedEmpleado.certificadoBancarioURL
      ];

      for (const fileURL of filesToDelete) {
        if (fileURL) {
          await deleteFileFromStorage(fileURL);
        }
      }

      // Log de auditoría antes de eliminar
      await logActivity(
        'delete',
        'empleado',
        selectedEmpleado.id,
        { nombres: selectedEmpleado.nombres, apellidos: selectedEmpleado.apellidos },
        currentUser.uid,
        userProfile?.name || userProfile?.displayName || 'Usuario desconocido',
        currentUser.email
      );

      // Eliminar documento de Firestore
      await deleteDoc(doc(db, 'empleados', selectedEmpleado.id));

      addNotification('Empleado eliminado exitosamente', 'success');
      setDeleteDialogOpen(false);
      setSelectedEmpleado(null);
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      addNotification('Error al eliminar empleado: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };


  // Eliminar archivo de un empleado (usado por EmpleadoForm en modo edit)
  const handleDeleteEmpleadoFile = async (fieldName, fileUrl) => {
    try {
      await deleteFileFromStorage(fileUrl);
      await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
        [fieldName]: ''
      });
      setSelectedEmpleado(prev => ({
        ...prev,
        [fieldName]: ''
      }));
      addNotification('Archivo eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      addNotification('Error al eliminar el archivo', 'error');
    }
  };

  // Abrir modal de agregar
  const handleOpenAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  // Abrir modal de editar
  const handleOpenEditDialog = (empleado) => {
    setSelectedEmpleado(empleado);
    
    // Formatear número de documento con puntos
    const numeroFormateado = empleado.numeroDocumento 
      ? formatearNumeroDocumento(empleado.numeroDocumento) 
      : '';

    setFormData({
      nombres: empleado.nombres || '',
      apellidos: empleado.apellidos || '',
      nacionalidad: empleado.nacionalidad || 'Colombiana',
      tipoDocumento: empleado.tipoDocumento || 'CC',
      numeroDocumento: numeroFormateado,
      emailCorporativo: empleado.emailCorporativo || '',
      telefono: empleado.telefono || '',
      edad: empleado.edad || '',
      fechaNacimiento: empleado.fechaNacimiento || '',
      empresaContratante: empleado.empresaContratante || '',
      contratoURL: empleado.contratoURL || '',
      fechaInicioContrato: empleado.fechaInicioContrato || '',
      tipoVigencia: empleado.tipoVigencia || 'Trimestral',
      fechaFinContrato: empleado.fechaFinContrato || '',
      seRenueva: empleado.seRenueva || false,
      banco: empleado.banco || '',
      tipoCuenta: empleado.tipoCuenta || 'Ahorros',
      numeroCuenta: empleado.numeroCuenta || '',
      certificadoBancarioURL: empleado.certificadoBancarioURL || '',
      documentoIdentidadURL: empleado.documentoIdentidadURL || '',
      retirado: empleado.retirado || false,
      fechaRetiro: empleado.fechaRetiro || '',
      motivoRetiro: empleado.motivoRetiro || '',
      salarioBase: empleado.salarioBase ? formatearNumeroDocumento(String(empleado.salarioBase)) : '',
      cargo: empleado.cargo || '',
      tipoNomina: empleado.tipoNomina || 'mensual',
      eps: empleado.eps || '',
      fondoPension: empleado.fondoPension || '',
      fondoCesantias: empleado.fondoCesantias || '',
      arl: empleado.arl || '',
      nivelRiesgoArl: empleado.nivelRiesgoArl || 'I',
      cajaCompensacion: empleado.cajaCompensacion || ''
    });
    setEditDialogOpen(true);
  };

  // Abrir modal de ver
  const handleOpenViewDialog = (empleado) => {
    setSelectedEmpleado(empleado);
    setViewDialogOpen(true);
  };

  // Abrir modal de eliminar
  const handleOpenDeleteDialog = (empleado) => {
    setSelectedEmpleado(empleado);
    setDeleteDialogOpen(true);
  };

  // Abrir visor PDF
  const handleOpenPdfViewer = (url, title) => {
    setPdfViewerUrl(url);
    setPdfViewerTitle(title);
    setPdfViewerOpen(true);
  };



  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      // Parsear fecha como local (no UTC) para evitar problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      return format(fecha, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ 
      p: embedded ? 0 : { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* HEADER GRADIENT SOBRIO */}
      {!embedded && (
      <Paper 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          mb: 3
        }}
      >
        <Box sx={{
          p: 3,
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Información principal */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              ADMINISTRACIÓN • EMPLEADOS
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mt: 0.5, 
              mb: 0.5,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PersonIcon /> Gestión de Empleados
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {empleados.length} {empleados.length === 1 ? 'empleado registrado' : 'empleados registrados'}
            </Typography>
          </Box>

          {/* Indicadores y acciones */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', md: 'row' },
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center'
          }}>
            <Chip 
              size="small" 
              label={`${empleados.length} empleado${empleados.length !== 1 ? 's' : ''}`} 
              sx={{ 
                fontWeight: 600, 
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }} 
            />
            
            {/* Botón de nueva empresa */}
            {isAdmin && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                Nuevo Empleado
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      )}

      {/* Contenido principal */}
      {loading ? (
        <PageSkeleton variant="table" kpiCount={0} rows={8} />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      ) : empleados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay empleados registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Comienza agregando el primer empleado al sistema
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                >
                  Agregar Primer Empleado
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          {empleados.map((empleado, index) => (
            <Grid item xs={12} sm={6} md={4} key={empleado.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header con acciones */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Chip
                          label="Empleado"
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenViewDialog(empleado)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {isAdmin && (
                          <>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenEditDialog(empleado)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteDialog(empleado)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Avatar y nombre */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2, 
                          bgcolor: 'primary.main',
                          fontSize: 20,
                          fontWeight: 'bold'
                        }}
                      >
                        {empleado.nombres?.charAt(0)}{empleado.apellidos?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                            {empleado.nombres} {empleado.apellidos}
                          </Typography>
                          {empleado.retirado && (
                            <Chip 
                              label="RETIRADO" 
                              size="small" 
                              color="warning"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          CC: {formatearNumeroDocumento(empleado.numeroDocumento || '')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Información básica */}
                    {empleado.emailCorporativo && (
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <EmailIcon sx={{ fontSize: 18, mr: 1.5, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                          {empleado.emailCorporativo}
                        </Typography>
                      </Box>
                    )}

                    {empleado.telefono && (
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Box display="flex" alignItems="center" sx={{ flex: 1 }}>
                          <PhoneIcon sx={{ fontSize: 18, mr: 1.5, color: 'primary.main' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                            {empleado.telefono}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const phoneNumber = empleado.telefono.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${phoneNumber}`, '_blank');
                          }}
                          sx={{
                            color: '#25D366',
                            '&:hover': {
                              backgroundColor: alpha('#25D366', 0.1)
                            }
                          }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Box>
                    )}

                    {/* Empresa Contratante */}
                    {empleado.empresaContratante && (
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <WorkIcon sx={{ fontSize: 18, mr: 1.5, color: 'info.main' }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {empleado.empresaContratante}
                        </Typography>
                      </Box>
                    )}

                    {/* Tiempo en la Empresa */}
                    {empleado.fechaInicioContrato && (
                      <Box display="flex" alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 18, mr: 1.5, color: empleado.retirado ? 'warning.main' : 'success.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {calcularTiempoEnEmpresa(empleado.fechaInicioContrato, empleado.retirado ? empleado.fechaRetiro : null)}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal Agregar Empleado */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40
              }}
            >
              <PersonIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              Agregar Nuevo Empleado
            </Typography>
          </Box>
          <IconButton
            onClick={() => setAddDialogOpen(false)}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.text.secondary, 0.08)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box sx={{ mt: 2 }}>
            <EmpleadoForm
              mode="add"
              formData={formData}
              handleFormChange={handleFormChange}
              empresas={empresas}
              calcularFechaFinContrato={calcularFechaFinContrato}
              documentoIdentidadFile={documentoIdentidadFile}
              setDocumentoIdentidadFile={setDocumentoIdentidadFile}
              contratoFile={contratoFile}
              setContratoFile={setContratoFile}
              certificadoFile={certificadoFile}
              setCertificadoFile={setCertificadoFile}
              dragOverDocumento={dragOverDocumento}
              dragOverContrato={dragOverContrato}
              dragOverCertificado={dragOverCertificado}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              uploadingDocumentoIdentidad={uploadingDocumentoIdentidad}
              uploadingContrato={uploadingContrato}
              uploadingCertificado={uploadingCertificado}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          gap: 1.5,
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={saving}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddEmpleado}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Empleado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Empleado - Similar estructura */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
          bgcolor: alpha(theme.palette.secondary.main, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                width: 40,
                height: 40
              }}
            >
              <EditIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              Editar Empleado
            </Typography>
          </Box>
          <IconButton
            onClick={() => setEditDialogOpen(false)}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.text.secondary, 0.08)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box sx={{ mt: 2 }}>
            <EmpleadoForm
              mode="edit"
              formData={formData}
              handleFormChange={handleFormChange}
              empresas={empresas}
              calcularFechaFinContrato={calcularFechaFinContrato}
              documentoIdentidadFile={documentoIdentidadFile}
              setDocumentoIdentidadFile={setDocumentoIdentidadFile}
              contratoFile={contratoFile}
              setContratoFile={setContratoFile}
              certificadoFile={certificadoFile}
              setCertificadoFile={setCertificadoFile}
              dragOverDocumento={dragOverDocumento}
              dragOverContrato={dragOverContrato}
              dragOverCertificado={dragOverCertificado}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              uploadingDocumentoIdentidad={uploadingDocumentoIdentidad}
              uploadingContrato={uploadingContrato}
              uploadingCertificado={uploadingCertificado}
              selectedEmpleado={selectedEmpleado}
              onViewFile={handleOpenPdfViewer}
              onDeleteFile={handleDeleteEmpleadoFile}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          gap: 1.5,
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={saving}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditEmpleado}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            {saving ? 'Guardando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Ver Empleado */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40
              }}
            >
              <VisibilityIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                Detalles de {selectedEmpleado?.nombres} {selectedEmpleado?.apellidos}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label="Empleado"
              color="primary"
              size="small"
              sx={{ fontWeight: 500 }}
            />
            {selectedEmpleado?.retirado && (
              <Chip
                label="RETIRADO"
                color="warning"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            <IconButton
              onClick={() => setViewDialogOpen(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.secondary, 0.08)
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          {selectedEmpleado && (
            <>
              {/* Información Personal */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                <BadgeIcon sx={{ fontSize: 18 }} />
                Información Personal
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Primera fila */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Nombre Completo
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.nombres} {selectedEmpleado.apellidos}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Nacionalidad
                    </Typography>
                    <Typography variant="body1">
                      {selectedEmpleado.nacionalidad || 'No especificada'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Segunda fila */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tipo y N° Documento
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.tipoDocumento} {formatearNumeroDocumento(selectedEmpleado.numeroDocumento || '')}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedEmpleado.fechaNacimiento)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Edad
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.edad || 'No especificada'} años
                    </Typography>
                  </Paper>
                </Grid>

                {/* Tercera fila */}
                {selectedEmpleado.emailCorporativo && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Email Corporativo
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedEmpleado.emailCorporativo}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {selectedEmpleado.telefono && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Teléfono
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body1" fontWeight="medium">
                          {selectedEmpleado.telefono}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const phoneNumber = selectedEmpleado.telefono.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${phoneNumber}`, '_blank');
                          }}
                          sx={{
                            color: '#25D366',
                            '&:hover': {
                              backgroundColor: alpha('#25D366', 0.1)
                            }
                          }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Documento de Identidad */}
              {selectedEmpleado.documentoIdentidadURL && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <BadgeIcon sx={{ fontSize: 18 }} />
                    Documento de Identidad
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Archivo Adjunto
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Documento de identidad disponible para visualización
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              setPdfViewerUrl(selectedEmpleado.documentoIdentidadURL);
                              setPdfViewerTitle('Documento de Identidad');
                              setPdfViewerOpen(true);
                            }}
                          >
                            Ver Documento
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Información Laboral */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                <WorkIcon sx={{ fontSize: 18 }} />
                Información Laboral
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Primera fila: Empresa Contratante y Tipo de Vigencia */}
                {selectedEmpleado.empresaContratante && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <WorkIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Empresa Contratante
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {(() => {
                          const empresa = empresas.find(e => e.name === selectedEmpleado.empresaContratante);
                          return (
                            <>
                              {empresa?.logoURL && (
                                <Avatar
                                  src={empresa.logoURL}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {selectedEmpleado.empresaContratante.charAt(0)}
                                </Avatar>
                              )}
                              <Typography variant="body1" fontWeight="medium">
                                {selectedEmpleado.empresaContratante}
                              </Typography>
                            </>
                          );
                        })()}
                      </Box>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12} md={selectedEmpleado.empresaContratante ? 6 : 12}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tipo de Vigencia
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.tipoVigencia || 'No especificado'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Segunda fila: Fecha Inicio y Tiempo en la Empresa */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Fecha Inicio
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedEmpleado.fechaInicioContrato)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Tiempo en la Empresa
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {(() => {
                        if (!selectedEmpleado.fechaInicioContrato) return 'No disponible';
                        
                        // Parsear fecha como local (no UTC) para evitar problemas de zona horaria
                        const [year, month, day] = selectedEmpleado.fechaInicioContrato.split('-').map(Number);
                        const fechaInicio = new Date(year, month - 1, day);
                        const hoy = new Date();
                        
                        let años = hoy.getFullYear() - fechaInicio.getFullYear();
                        let meses = hoy.getMonth() - fechaInicio.getMonth();
                        
                        if (meses < 0) {
                          años--;
                          meses += 12;
                        }
                        
                        if (años > 0 && meses > 0) {
                          return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
                        } else if (años > 0) {
                          return `${años} año${años > 1 ? 's' : ''}`;
                        } else if (meses > 0) {
                          return `${meses} mes${meses > 1 ? 'es' : ''}`;
                        } else {
                          return 'Menos de 1 mes';
                        }
                      })()}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedEmpleado.tipoVigencia !== 'Indefinido' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Fecha Fin Actual
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(calcularFechaFinContrato(selectedEmpleado.fechaInicioContrato, selectedEmpleado.tipoVigencia))}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}`, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Siguiente Renovación
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(calcularSiguienteRenovacion(selectedEmpleado.fechaInicioContrato, selectedEmpleado.tipoVigencia))}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                          bgcolor: selectedEmpleado.seRenueva 
                            ? alpha(theme.palette.success.main, 0.04)
                            : alpha(theme.palette.action.hover, 0.04)
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            label={selectedEmpleado.seRenueva ? 'Renovación Automática' : 'Sin Renovación'}
                            color={selectedEmpleado.seRenueva ? 'success' : 'default'}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {selectedEmpleado.seRenueva 
                              ? 'Este contrato se renovará automáticamente al finalizar el período'
                              : 'Este contrato NO se renovará automáticamente'
                            }
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </>
                )}

                {selectedEmpleado.contratoURL && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contrato Laboral
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Documento de contrato disponible
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PdfIcon />}
                          onClick={() => handleOpenPdfViewer(selectedEmpleado.contratoURL, 'Contrato Laboral')}
                        >
                          Ver Contrato
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Información de Nómina */}
              {(selectedEmpleado.salarioBase > 0 || selectedEmpleado.cargo) && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <AttachMoneyIcon sx={{ fontSize: 18 }} />
                    Información de Nómina
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {selectedEmpleado.salarioBase > 0 && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Salario Base
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            $ {formatearNumeroDocumento(String(selectedEmpleado.salarioBase))}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedEmpleado.cargo && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Cargo
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.cargo}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Periodicidad
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedEmpleado.tipoNomina === 'quincenal' ? 'Quincenal' : 'Mensual'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Seguridad Social */}
              {(selectedEmpleado.eps || selectedEmpleado.fondoPension || selectedEmpleado.arl) && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <LocalHospitalIcon sx={{ fontSize: 18 }} />
                    Seguridad Social y Parafiscales
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {selectedEmpleado.eps && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            EPS
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.eps}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedEmpleado.fondoPension && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Fondo de Pensión
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.fondoPension}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedEmpleado.fondoCesantias && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Fondo de Cesantías
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.fondoCesantias}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedEmpleado.arl && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            ARL
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.arl} — Nivel {selectedEmpleado.nivelRiesgoArl || 'I'} ({(NIVELES_RIESGO_ARL.find(n => n.value === (selectedEmpleado.nivelRiesgoArl || 'I'))?.porcentaje || 0.522)}%)
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedEmpleado.cajaCompensacion && (
                      <Grid item xs={12} md={4}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Caja de Compensación
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpleado.cajaCompensacion}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* Estado Laboral (si está retirado) */}
              {selectedEmpleado.retirado && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <InfoIcon sx={{ fontSize: 18 }} />
                    Estado Laboral
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                          bgcolor: alpha(theme.palette.warning.main, 0.04)
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip 
                            label="EMPLEADO RETIRADO" 
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="warning.main" gutterBottom>
                              <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              Fecha de Retiro
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {formatDate(selectedEmpleado.fechaRetiro)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="warning.main" gutterBottom>
                              Motivo de Retiro
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedEmpleado.motivoRetiro || 'No especificado'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Información Bancaria */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 700, fontSize: '0.75rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                <AccountBalanceIcon sx={{ fontSize: 18 }} />
                Información Bancaria
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Entidad Bancaria
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.banco || 'No especificado'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tipo de Cuenta
                    </Typography>
                    <Typography variant="body1">
                      {selectedEmpleado.tipoCuenta || 'No especificado'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Número de Cuenta
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.numeroCuenta || 'No especificado'}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedEmpleado.certificadoBancarioURL && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Certificado Bancario
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Certificación bancaria disponible
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={<PdfIcon />}
                          onClick={() => handleOpenPdfViewer(selectedEmpleado.certificadoBancarioURL, 'Certificado Bancario')}
                        >
                          Ver Certificado
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Eliminar Empleado */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{
          background: alpha(theme.palette.error.main, 0.1),
          color: 'error.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <DeleteIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Estás seguro de que deseas eliminar el empleado <strong>{selectedEmpleado?.nombres} {selectedEmpleado?.apellidos}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteEmpleado}
            variant="contained"
            color="error"
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal PDF Viewer */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PdfIcon color="error" />
            <Typography variant="h6">{pdfViewerTitle}</Typography>
          </Box>
          <IconButton onClick={() => setPdfViewerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfViewerUrl && (
            <iframe
              src={pdfViewerUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title={pdfViewerTitle}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* FAB para agregar empleado rápido */}
      {isAdmin && (
        <Fab
          color="primary"
          aria-label="agregar empleado"
          onClick={handleOpenAddDialog}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
          }}
        >
          <AddIcon />
        </Fab>
      )}

    </Box>
  );
};

export default EmpleadosPage;
