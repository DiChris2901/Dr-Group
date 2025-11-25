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
  CircularProgress,
  Alert,
  Fab,
  alpha,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Autocomplete
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
  CreditCard as CardIcon
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Lista de bancos en Colombia
const BANCOS_COLOMBIA = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Banco Caja Social',
  'Banco AV Villas',
  'Banco Agrario',
  'Banco Pichincha',
  'Banco Falabella',
  'Banco Finandina',
  'Banco GNB Sudameris',
  'Banco Cooperativo Coopcentral',
  'Banco Serfinanza',
  'Banco Mundo Mujer',
  'Bancamía',
  'Banco W',
  'Banco Credifinanciera',
  'Itaú',
  'Scotiabank Colpatria',
  'Citibank',
  'Nequi',
  'Daviplata',
  'Movii',
  'Rappipay',
  'Banco Santander',
  'Lulo Bank'
].sort();

const EmpleadosPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const theme = useTheme();
  const isAdmin = isAdminUser(currentUser, userProfile);
  
  const [empleados, setEmpleados] = useState([]);
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
    contratoURL: '',
    fechaInicioContrato: '',
    tipoVigencia: 'Trimestral',
    fechaFinContrato: '',
    seRenueva: false,
    banco: '',
    tipoCuenta: 'Ahorros',
    numeroCuenta: '',
    certificadoBancarioURL: '',
    documentoIdentidadURL: ''
  });

  const [contratoFile, setContratoFile] = useState(null);
  const [uploadingContrato, setUploadingContrato] = useState(false);
  const [certificadoFile, setCertificadoFile] = useState(null);
  const [uploadingCertificado, setUploadingCertificado] = useState(false);
  const [documentoIdentidadFile, setDocumentoIdentidadFile] = useState(null);
  const [uploadingDocumentoIdentidad, setUploadingDocumentoIdentidad] = useState(false);

  // Estados para Modal PDF Viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');

  // Cargar empleados desde Firestore
  useEffect(() => {
    if (!currentUser) return;

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
  }, [currentUser, addNotification]);

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

  // Calcular fecha fin de contrato según tipo de vigencia
  const calcularFechaFinContrato = (fechaInicio, tipoVigencia) => {
    if (!fechaInicio || tipoVigencia === 'Indefinido') return '';
    
    const fecha = new Date(fechaInicio);
    
    switch (tipoVigencia) {
      case 'Trimestral':
        fecha.setMonth(fecha.getMonth() + 3);
        break;
      case 'Semestral':
        fecha.setMonth(fecha.getMonth() + 6);
        break;
      case 'Anual':
        fecha.setFullYear(fecha.getFullYear() + 1);
        break;
      default:
        return '';
    }
    
    // Formatear como YYYY-MM-DD para input type="date"
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      documentoIdentidadURL: ''
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

      // Subir nuevos archivos si se seleccionaron
      if (contratoFile) {
        setUploadingContrato(true);
        contratoURL = await uploadFile(contratoFile, 'contratos', selectedEmpleado.id);
      }

      if (certificadoFile) {
        setUploadingCertificado(true);
        certificadoURL = await uploadFile(certificadoFile, 'certificados', selectedEmpleado.id);
      }

      if (documentoIdentidadFile) {
        setUploadingDocumentoIdentidad(true);
        documentoIdentidadURL = await uploadFile(documentoIdentidadFile, 'documentos-identidad', selectedEmpleado.id);
      }

      // Remover puntos del número de documento antes de guardar
      const numeroDocumentoSinPuntos = formData.numeroDocumento.replace(/\./g, '');

      // Actualizar documento
      await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
        ...formData,
        numeroDocumento: numeroDocumentoSinPuntos,
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

      // Eliminar documento
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
      contratoURL: empleado.contratoURL || '',
      fechaInicioContrato: empleado.fechaInicioContrato || '',
      tipoVigencia: empleado.tipoVigencia || 'Trimestral',
      fechaFinContrato: empleado.fechaFinContrato || '',
      seRenueva: empleado.seRenueva || false,
      banco: empleado.banco || '',
      tipoCuenta: empleado.tipoCuenta || 'Ahorros',
      numeroCuenta: empleado.numeroCuenta || '',
      certificadoBancarioURL: empleado.certificadoBancarioURL || '',
      documentoIdentidadURL: empleado.documentoIdentidadURL || ''
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
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* HEADER GRADIENT SOBRIO */}
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
          mb: 4
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

      {/* Contenido principal */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
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
                        <Typography variant="h6" gutterBottom sx={{ mb: 0.5, fontWeight: 600 }}>
                          {empleado.nombres} {empleado.apellidos}
                        </Typography>
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
                      <Box display="flex" alignItems="center" justifyContent="space-between">
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
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB para agregar empleado */}
      {isAdmin && (
        <Fab
          color="primary"
          aria-label="agregar empleado"
          onClick={handleOpenAddDialog}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <AddIcon />
        </Fab>
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
            boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <PersonIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Agregar Nuevo Empleado
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            {/* Información Personal */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Personal
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombres *"
                value={formData.nombres}
                onChange={(e) => handleFormChange('nombres', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellidos *"
                value={formData.apellidos}
                onChange={(e) => handleFormChange('apellidos', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nacionalidad"
                value={formData.nacionalidad}
                onChange={(e) => handleFormChange('nacionalidad', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Documento</InputLabel>
                <Select
                  value={formData.tipoDocumento}
                  onChange={(e) => handleFormChange('tipoDocumento', e.target.value)}
                  label="Tipo Documento"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                  <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                  <MenuItem value="PAS">Pasaporte</MenuItem>
                  <MenuItem value="TI">Tarjeta de Identidad</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="N° Documento *"
                value={formData.numeroDocumento}
                onChange={(e) => handleFormChange('numeroDocumento', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Corporativo"
                type="email"
                value={formData.emailCorporativo}
                onChange={(e) => handleFormChange('emailCorporativo', e.target.value)}
                placeholder="ejemplo@drgroup.com"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleFormChange('telefono', e.target.value)}
                placeholder="+57 300 123 4567"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Edad"
                value={formData.edad}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                helperText="Se calcula automáticamente"
              />
            </Grid>

            {/* Documento de Identidad */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.02)
                }}
              >
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  style={{ display: 'none' }}
                  id="documento-identidad-upload"
                  onChange={(e) => setDocumentoIdentidadFile(e.target.files[0])}
                />
                <label htmlFor="documento-identidad-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<BadgeIcon />}
                    fullWidth
                    color="info"
                    sx={{ borderRadius: 2 }}
                  >
                    {documentoIdentidadFile ? documentoIdentidadFile.name : 'Adjuntar Documento de Identidad (PDF o Imagen)'}
                  </Button>
                </label>
                {uploadingDocumentoIdentidad && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Subiendo documento...</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Información Laboral */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Laboral
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fecha Inicio Contrato"
                type="date"
                value={formData.fechaInicioContrato}
                onChange={(e) => handleFormChange('fechaInicioContrato', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Vigencia</InputLabel>
                <Select
                  value={formData.tipoVigencia}
                  onChange={(e) => handleFormChange('tipoVigencia', e.target.value)}
                  label="Tipo de Vigencia"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Trimestral">Trimestral (3 meses)</MenuItem>
                  <MenuItem value="Semestral">Semestral (6 meses)</MenuItem>
                  <MenuItem value="Anual">Anual (12 meses)</MenuItem>
                  <MenuItem value="Indefinido">Indefinido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tipoVigencia !== 'Indefinido' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha Fin Contrato"
                  type="date"
                  value={formData.fechaFinContrato}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText="Calculada automáticamente"
                />
              </Grid>
            )}

            {formData.tipoVigencia !== 'Indefinido' && (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.02)
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.seRenueva}
                        onChange={(e) => handleFormChange('seRenueva', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ¿El contrato se renueva automáticamente?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Indica si este contrato {formData.tipoVigencia?.toLowerCase()} se renovará al finalizar el período
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="contrato-upload"
                  onChange={(e) => setContratoFile(e.target.files[0])}
                />
                <label htmlFor="contrato-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ borderRadius: 2 }}
                  >
                    {contratoFile ? contratoFile.name : 'Subir Contrato Laboral (PDF)'}
                  </Button>
                </label>
                {uploadingContrato && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Subiendo contrato...</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Información Bancaria */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Bancaria
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                freeSolo
                options={BANCOS_COLOMBIA}
                value={formData.banco}
                onChange={(event, newValue) => {
                  handleFormChange('banco', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('banco', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banco"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  value={formData.tipoCuenta}
                  onChange={(e) => handleFormChange('tipoCuenta', e.target.value)}
                  label="Tipo de Cuenta"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Ahorros">Ahorros</MenuItem>
                  <MenuItem value="Corriente">Corriente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Número de Cuenta"
                value={formData.numeroCuenta}
                onChange={(e) => handleFormChange('numeroCuenta', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.success.main, 0.02)
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="certificado-upload"
                  onChange={(e) => setCertificadoFile(e.target.files[0])}
                />
                <label htmlFor="certificado-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    color="success"
                    sx={{ borderRadius: 2 }}
                  >
                    {certificadoFile ? certificadoFile.name : 'Subir Certificado Bancario (PDF)'}
                  </Button>
                </label>
                {uploadingCertificado && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Subiendo certificado...</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddEmpleado}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{ borderRadius: 2 }}
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
            boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <EditIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Editar Empleado
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Mismo contenido que el modal de agregar */}
          <Grid container spacing={2.5}>
            {/* Copiar estructura del modal de agregar */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Personal
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombres *"
                value={formData.nombres}
                onChange={(e) => handleFormChange('nombres', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellidos *"
                value={formData.apellidos}
                onChange={(e) => handleFormChange('apellidos', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nacionalidad"
                value={formData.nacionalidad}
                onChange={(e) => handleFormChange('nacionalidad', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Documento</InputLabel>
                <Select
                  value={formData.tipoDocumento}
                  onChange={(e) => handleFormChange('tipoDocumento', e.target.value)}
                  label="Tipo Documento"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                  <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                  <MenuItem value="PAS">Pasaporte</MenuItem>
                  <MenuItem value="TI">Tarjeta de Identidad</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="N° Documento *"
                value={formData.numeroDocumento}
                onChange={(e) => handleFormChange('numeroDocumento', e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Corporativo"
                type="email"
                value={formData.emailCorporativo}
                onChange={(e) => handleFormChange('emailCorporativo', e.target.value)}
                placeholder="ejemplo@drgroup.com"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleFormChange('telefono', e.target.value)}
                placeholder="+57 300 123 4567"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Edad"
                value={formData.edad}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                helperText="Se calcula automáticamente"
              />
            </Grid>

            {/* Documento de Identidad */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.02)
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    id="documento-identidad-upload-edit"
                    onChange={(e) => setDocumentoIdentidadFile(e.target.files[0])}
                  />
                  <label htmlFor="documento-identidad-upload-edit">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<BadgeIcon />}
                      fullWidth
                      color="info"
                      sx={{ borderRadius: 2 }}
                    >
                      {documentoIdentidadFile ? documentoIdentidadFile.name : selectedEmpleado?.documentoIdentidadURL ? 'Cambiar Documento de Identidad' : 'Adjuntar Documento de Identidad'}
                    </Button>
                  </label>
                  {selectedEmpleado?.documentoIdentidadURL && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setPdfViewerUrl(selectedEmpleado.documentoIdentidadURL);
                          setPdfViewerTitle('Documento de Identidad');
                          setPdfViewerOpen(true);
                        }}
                        sx={{ borderRadius: 2, flex: 1 }}
                      >
                        Ver documento actual
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={async () => {
                          if (window.confirm('¿Estás seguro de que deseas eliminar el documento de identidad?')) {
                            try {
                              await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
                                documentoIdentidadURL: ''
                              });
                              setSelectedEmpleado({ ...selectedEmpleado, documentoIdentidadURL: '' });
                              addNotification('Documento eliminado exitosamente', 'success');
                            } catch (error) {
                              console.error('Error al eliminar documento:', error);
                              addNotification('Error al eliminar documento', 'error');
                            }
                          }
                        }}
                        sx={{ borderRadius: 2, flex: 1 }}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  )}
                  {uploadingDocumentoIdentidad && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Subiendo documento...</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Información Laboral */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Laboral
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fecha Inicio Contrato"
                type="date"
                value={formData.fechaInicioContrato}
                onChange={(e) => handleFormChange('fechaInicioContrato', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Vigencia</InputLabel>
                <Select
                  value={formData.tipoVigencia}
                  onChange={(e) => handleFormChange('tipoVigencia', e.target.value)}
                  label="Tipo de Vigencia"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Trimestral">Trimestral (3 meses)</MenuItem>
                  <MenuItem value="Semestral">Semestral (6 meses)</MenuItem>
                  <MenuItem value="Anual">Anual (12 meses)</MenuItem>
                  <MenuItem value="Indefinido">Indefinido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tipoVigencia !== 'Indefinido' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha Fin Contrato"
                  type="date"
                  value={formData.fechaFinContrato}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText="Calculada automáticamente"
                />
              </Grid>
            )}

            {formData.tipoVigencia !== 'Indefinido' && (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.02)
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.seRenueva}
                        onChange={(e) => handleFormChange('seRenueva', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ¿El contrato se renueva automáticamente?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Indica si este contrato {formData.tipoVigencia?.toLowerCase()} se renovará al finalizar el período
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="contrato-upload-edit"
                  onChange={(e) => setContratoFile(e.target.files[0])}
                />
                <label htmlFor="contrato-upload-edit">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ borderRadius: 2 }}
                  >
                    {contratoFile ? contratoFile.name : selectedEmpleado?.contratoURL ? 'Cambiar Contrato' : 'Subir Contrato'}
                  </Button>
                </label>
                {selectedEmpleado?.contratoURL && !contratoFile && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenPdfViewer(selectedEmpleado.contratoURL, 'Contrato Laboral')}
                      sx={{ flex: 1 }}
                    >
                      Ver contrato actual
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={async () => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar el contrato?')) {
                          try {
                            await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
                              contratoURL: ''
                            });
                            setSelectedEmpleado({ ...selectedEmpleado, contratoURL: '' });
                            addNotification('Contrato eliminado exitosamente', 'success');
                          } catch (error) {
                            console.error('Error al eliminar contrato:', error);
                            addNotification('Error al eliminar contrato', 'error');
                          }
                        }
                      }}
                      sx={{ borderRadius: 2, flex: 1 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Información Bancaria */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                fontSize: '0.7rem'
              }}>
                Información Bancaria
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                freeSolo
                options={BANCOS_COLOMBIA}
                value={formData.banco}
                onChange={(event, newValue) => {
                  handleFormChange('banco', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('banco', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banco"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  value={formData.tipoCuenta}
                  onChange={(e) => handleFormChange('tipoCuenta', e.target.value)}
                  label="Tipo de Cuenta"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Ahorros">Ahorros</MenuItem>
                  <MenuItem value="Corriente">Corriente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Número de Cuenta"
                value={formData.numeroCuenta}
                onChange={(e) => handleFormChange('numeroCuenta', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  bgcolor: alpha(theme.palette.success.main, 0.02)
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="certificado-upload-edit"
                  onChange={(e) => setCertificadoFile(e.target.files[0])}
                />
                <label htmlFor="certificado-upload-edit">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    color="success"
                    sx={{ borderRadius: 2 }}
                  >
                    {certificadoFile ? certificadoFile.name : selectedEmpleado?.certificadoBancarioURL ? 'Cambiar Certificado' : 'Subir Certificado'}
                  </Button>
                </label>
                {selectedEmpleado?.certificadoBancarioURL && !certificadoFile && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenPdfViewer(selectedEmpleado.certificadoBancarioURL, 'Certificado Bancario')}
                      sx={{ flex: 1 }}
                    >
                      Ver certificado actual
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={async () => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar el certificado bancario?')) {
                          try {
                            await updateDoc(doc(db, 'empleados', selectedEmpleado.id), {
                              certificadoBancarioURL: ''
                            });
                            setSelectedEmpleado({ ...selectedEmpleado, certificadoBancarioURL: '' });
                            addNotification('Certificado eliminado exitosamente', 'success');
                          } catch (error) {
                            console.error('Error al eliminar certificado:', error);
                            addNotification('Error al eliminar certificado', 'error');
                          }
                        }
                      }}
                      sx={{ borderRadius: 2, flex: 1 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditEmpleado}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{ borderRadius: 2 }}
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
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              Detalles de {selectedEmpleado?.nombres} {selectedEmpleado?.apellidos}
            </Box>
            <Chip
              label="Empleado"
              color="primary"
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedEmpleado && (
            <>
              {/* Información Personal en Grid Horizontal */}
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon />
                Información Personal
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Primera fila */}
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Nombre Completo
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.nombres} {selectedEmpleado.apellidos}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Nacionalidad
                    </Typography>
                    <Typography variant="body1">
                      {selectedEmpleado.nacionalidad || 'No especificada'}
                    </Typography>
                  </Card>
                </Grid>

                {/* Segunda fila */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Tipo Documento
                    </Typography>
                    <Typography variant="body1">
                      {selectedEmpleado.tipoDocumento}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      N° Documento
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatearNumeroDocumento(selectedEmpleado.numeroDocumento || '')}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Edad
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.edad || 'No especificada'} años
                    </Typography>
                  </Card>
                </Grid>

                {/* Tercera fila */}
                {selectedEmpleado.emailCorporativo && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Email Corporativo
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedEmpleado.emailCorporativo}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {selectedEmpleado.telefono && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
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
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12} md={selectedEmpleado.emailCorporativo || selectedEmpleado.telefono ? 12 : 4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedEmpleado.fechaNacimiento)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Documento de Identidad */}
              {selectedEmpleado.documentoIdentidadURL && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon />
                    Documento de Identidad
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" color="success" gutterBottom>
                              Archivo Adjunto
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Documento de identidad disponible para visualización
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
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
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Información Laboral */}
              <Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon />
                Información Laboral
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="info" gutterBottom>
                      <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Fecha Inicio
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedEmpleado.fechaInicioContrato)}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="info" gutterBottom>
                      Tipo de Vigencia
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.tipoVigencia || 'No especificado'}
                    </Typography>
                  </Card>
                </Grid>

                {selectedEmpleado.tipoVigencia !== 'Indefinido' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" color="info" gutterBottom>
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Fecha Fin
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(selectedEmpleado.fechaFinContrato)}
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          bgcolor: selectedEmpleado.seRenueva 
                            ? alpha(theme.palette.success.main, 0.05)
                            : alpha(theme.palette.grey[500], 0.05)
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
                      </Card>
                    </Grid>
                  </>
                )}

                {selectedEmpleado.contratoURL && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="info" gutterBottom>
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
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* Información Bancaria */}
              <Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon />
                Información Bancaria
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                      Entidad Bancaria
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.banco || 'No especificado'}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                      Tipo de Cuenta
                    </Typography>
                    <Typography variant="body1">
                      {selectedEmpleado.tipoCuenta || 'No especificado'}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                      Número de Cuenta
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedEmpleado.numeroCuenta || 'No especificado'}
                    </Typography>
                  </Card>
                </Grid>

                {selectedEmpleado.certificadoBancarioURL && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="secondary" gutterBottom>
                            Certificado Bancario
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Certificación bancaria disponible
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          startIcon={<PdfIcon />}
                          onClick={() => handleOpenPdfViewer(selectedEmpleado.certificadoBancarioURL, 'Certificado Bancario')}
                        >
                          Ver Certificado
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2 }}
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
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
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
    </Box>
  );
};

export default EmpleadosPage;
