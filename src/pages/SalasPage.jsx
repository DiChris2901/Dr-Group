import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  InputAdornment,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  MeetingRoom as RoomIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Wifi as WifiIcon,
  AcUnit as AcIcon,
  Tv as TvIcon,
  LocalCafe as CafeIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Block as BlockIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AddSalaModal from '../components/modals/AddSalaModal';
import ViewSalaModal from '../components/modals/ViewSalaModal';

/**
 * Página de Gestión de Salas
 * Permite gestionar salas asociadas a empresas con funcionalidades CRUD completas
 * Diseño siguiendo las reglas del proyecto con tema Spectacular
 */
const SalasPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const theme = useTheme();
  
  // Estados principales
  const [salas, setSalas] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de diálogos
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Estados de selección
  const [selectedSala, setSelectedSala] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propietarioFilter, setPropietarioFilter] = useState('all');
  const [proveedorFilter, setProveedorFilter] = useState('all');
  
  // ✅ NUEVO: Estado para empresa seleccionada en el grid
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  // Formulario para nueva/editar sala
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    companyName: '',
    proveedorOnline: '',
    ciudad: '',
    departamento: '',
    direccion: '',
    status: 'active',
    propietario: '',
    contactPhone: '',
    contactEmail: '',
    contactoAutorizado: '',
    contactPhone2: '',
    contactEmail2: '',
    contactoAutorizado2: '',
    administracion: 0,
    conexion: 0
  });
  
  // Estados para archivos adjuntos
  const [camaraComercioFile, setCamaraComercioFile] = useState(null);
  const [usoSuelosFile, setUsoSuelosFile] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);



  // Cargar empresas al montar el componente
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesQuery = query(
          collection(db, 'companies'),
          orderBy('name', 'asc')
        );
        
        const unsubscribe = onSnapshot(companiesQuery, (snapshot) => {
          const companiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCompanies(companiesData);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error cargando empresas:', error);
        setError('Error al cargar las empresas');
      }
    };

    loadCompanies();
  }, []);

  // Cargar salas al montar el componente
  useEffect(() => {
    const loadSalas = async () => {
      try {
        setLoading(true);
        const salasQuery = query(
          collection(db, 'salas'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(salasQuery, (snapshot) => {
          const salasData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSalas(salasData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error cargando salas:', error);
        setError('Error al cargar las salas');
        setLoading(false);
      }
    };

    loadSalas();
  }, []);

  // Filtrar salas
  const filteredSalas = salas.filter(sala => {
    const matchesStatus = statusFilter === 'all' || sala.status === statusFilter;
    const matchesPropietario = propietarioFilter === 'all' || sala.propietario === propietarioFilter;
    const matchesProveedor = proveedorFilter === 'all' || sala.proveedorOnline === proveedorFilter;
    
    // ✅ NUEVO: Filtro de búsqueda por texto
    const matchesSearch = searchTerm === '' || 
      sala.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.proveedorOnline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sala.contactoAutorizado?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPropietario && matchesProveedor && matchesSearch;
  });

  // Obtener listas únicas para los filtros
  const propietariosUnicos = ['all', ...new Set(salas.map(sala => sala.propietario).filter(Boolean))];
  const proveedoresUnicos = ['all', ...new Set(salas.map(sala => sala.proveedorOnline).filter(Boolean))];

  // ✅ Obtener contactos únicos con sus datos completos
  const contactosUnicos = React.useMemo(() => {
    const contactosMap = new Map();
    
    salas.forEach(sala => {
      // Contacto 1
      if (sala.contactoAutorizado && sala.contactoAutorizado.trim()) {
        const key = sala.contactoAutorizado.toLowerCase();
        if (!contactosMap.has(key)) {
          contactosMap.set(key, {
            nombre: sala.contactoAutorizado,
            telefono: sala.contactPhone || '',
            email: sala.contactEmail || ''
          });
        }
      }
      
      // Contacto 2
      if (sala.contactoAutorizado2 && sala.contactoAutorizado2.trim()) {
        const key = sala.contactoAutorizado2.toLowerCase();
        if (!contactosMap.has(key)) {
          contactosMap.set(key, {
            nombre: sala.contactoAutorizado2,
            telefono: sala.contactPhone2 || '',
            email: sala.contactEmail2 || ''
          });
        }
      }
    });
    
    return Array.from(contactosMap.values());
  }, [salas]);

  // ✅ Obtener propietarios únicos con sus datos completos (costos típicos)
  const propietariosConDatos = React.useMemo(() => {
    const propietariosMap = new Map();
    
    salas.forEach(sala => {
      if (sala.propietario && sala.propietario.trim()) {
        const key = sala.propietario.toLowerCase();
        
        // Si ya existe, actualizar con el valor más reciente (última sala agregada)
        if (!propietariosMap.has(key) || sala.createdAt > propietariosMap.get(key).createdAt) {
          propietariosMap.set(key, {
            nombre: sala.propietario,
            administracion: sala.administracion || 0,
            conexion: sala.conexion || 0,
            createdAt: sala.createdAt
          });
        }
      }
    });
    
    return Array.from(propietariosMap.values());
  }, [salas]);

  // ✅ NUEVO: Agrupar salas por empresa
  const companiesWithSalas = companies.map(company => ({
    ...company,
    salasCount: salas.filter(sala => sala.companyId === company.id).length,
    salas: salas.filter(sala => sala.companyId === company.id)
  }));

  // ✅ NUEVO: Salas de la empresa seleccionada
  const salasDeEmpresaSeleccionada = selectedCompanyId
    ? filteredSalas.filter(sala => sala.companyId === selectedCompanyId)
    : [];

  // Manejar cambios del formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia la empresa, actualizar el nombre
    if (field === 'companyId') {
      const selectedCompany = companies.find(company => company.id === value);
      setFormData(prev => ({
        ...prev,
        companyName: selectedCompany?.name || ''
      }));
    }
  };

  // ✅ Handler para autocompletar datos del contacto 1
  const handleContactoChange = (contactoObj) => {
    if (contactoObj && typeof contactoObj === 'object') {
      setFormData(prev => ({
        ...prev,
        contactoAutorizado: contactoObj.nombre,
        contactPhone: contactoObj.telefono,
        contactEmail: contactoObj.email
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        contactoAutorizado: contactoObj || ''
      }));
    }
  };

  // ✅ Handler para autocompletar datos del contacto 2
  const handleContacto2Change = (contactoObj) => {
    if (contactoObj && typeof contactoObj === 'object') {
      setFormData(prev => ({
        ...prev,
        contactoAutorizado2: contactoObj.nombre,
        contactPhone2: contactoObj.telefono,
        contactEmail2: contactoObj.email
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        contactoAutorizado2: contactoObj || ''
      }));
    }
  };

  // ✅ Handler para autocompletar datos del propietario (costos)
  const handlePropietarioChange = (propietarioObj) => {
    if (propietarioObj && typeof propietarioObj === 'object') {
      setFormData(prev => ({
        ...prev,
        propietario: propietarioObj.nombre,
        administracion: propietarioObj.administracion,
        conexion: propietarioObj.conexion
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        propietario: propietarioObj || ''
      }));
    }
  };

  // ✅ Handler para autocompletar departamento según ciudad seleccionada
  const handleCiudadChange = (ciudad) => {
    handleFormChange('ciudad', ciudad || '');
    
    // Si se seleccionó una ciudad, buscar el departamento asociado en registros previos
    if (ciudad) {
      const salaConDepartamento = salas.find(
        sala => sala.ciudad?.toLowerCase().trim() === ciudad.toLowerCase().trim() && sala.departamento
      );
      
      if (salaConDepartamento && salaConDepartamento.departamento) {
        // Autocompletar departamento si se encuentra
        handleFormChange('departamento', salaConDepartamento.departamento);
      }
    }
  };



  // Subir archivo a Firebase Storage
  const uploadFileToStorage = async (file, salaId, fileType) => {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `salas/${salaId}/${fileType}_${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: filePath,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: serverTimestamp()
      };
    } catch (error) {
      console.error(`Error subiendo archivo ${fileType}:`, error);
      throw error;
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      companyId: '',
      companyName: '',
      proveedorOnline: '',
      ciudad: '',
      departamento: '',
      direccion: '',
      status: 'active',
      propietario: '',
      contactPhone: '',
      contactEmail: '',
      contactoAutorizado: '',
      contactPhone2: '',
      contactEmail2: '',
      contactoAutorizado2: '',
      administracion: 0,
      conexion: 0
    });
    setCamaraComercioFile(null);
    setUsoSuelosFile(null);
  };

  // Crear nueva sala
  const handleCreateSala = async () => {
    try {
      setSaving(true);

      // Validaciones
      if (!formData.name.trim()) {
        addNotification('El nombre de la sala es obligatorio', 'error');
        return;
      }
      if (!formData.companyId) {
        addNotification('Debe seleccionar una empresa', 'error');
        return;
      }
      if (!formData.administracion || formData.administracion <= 0) {
        addNotification('El campo Administración es obligatorio', 'error');
        return;
      }
      if (!formData.conexion || formData.conexion <= 0) {
        addNotification('El campo Conexión es obligatorio', 'error');
        return;
      }

      const salaData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          averageUsage: 0
        }
      };

      const docRef = await addDoc(collection(db, 'salas'), salaData);
      
      // Subir archivos adjuntos si existen
      if (camaraComercioFile || usoSuelosFile) {
        setUploadingFiles(true);
        const attachments = {};
        
        try {
          if (camaraComercioFile) {
            const camaraData = await uploadFileToStorage(camaraComercioFile, docRef.id, 'camara_comercio');
            attachments.camaraComercio = camaraData;
          }
          
          if (usoSuelosFile) {
            const usoSuelosData = await uploadFileToStorage(usoSuelosFile, docRef.id, 'uso_suelos');
            attachments.usoSuelos = usoSuelosData;
          }
          
          // Actualizar documento con URLs de archivos
          await updateDoc(doc(db, 'salas', docRef.id), {
            attachments,
            updatedAt: serverTimestamp()
          });
        } catch (fileError) {
          console.error('Error subiendo archivos:', fileError);
          addNotification('Sala creada pero hubo un error al subir los archivos', 'warning');
        } finally {
          setUploadingFiles(false);
        }
      }
      
      // Registrar actividad
      await logActivity('create_room', 'room', docRef.id, {
        roomName: formData.name,
        companyName: formData.companyName,
        proveedorOnline: formData.proveedorOnline,
        ciudad: formData.ciudad,
        hasAttachments: !!(camaraComercioFile || usoSuelosFile)
      }, currentUser.uid, userProfile?.displayName, userProfile?.email);

      addNotification('Sala creada exitosamente', 'success');
      setAddDialogOpen(false);
      clearForm();
      
    } catch (error) {
      console.error('Error creando sala:', error);
      addNotification('Error al crear la sala', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Editar sala
  const handleEditSala = async () => {
    try {
      setSaving(true);

      const salaRef = doc(db, 'salas', selectedSala.id);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(salaRef, updateData);
      
      // Registrar actividad
      await logActivity('update_room', 'room', selectedSala.id, {
        roomName: formData.name,
        companyName: formData.companyName,
        changes: {
          propietario: formData.propietario,
          administracion: formData.administracion,
          conexion: formData.conexion,
          status: formData.status,
          ciudad: formData.ciudad,
          proveedorOnline: formData.proveedorOnline
        }
      }, currentUser.uid, userProfile?.displayName, userProfile?.email);

      addNotification('Sala actualizada exitosamente', 'success');
      setEditDialogOpen(false);
      setSelectedSala(null);
      clearForm();
      
    } catch (error) {
      console.error('Error actualizando sala:', error);
      addNotification('Error al actualizar la sala', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar sala
  const handleDeleteSala = async () => {
    try {
      setSaving(true);

      await deleteDoc(doc(db, 'salas', selectedSala.id));
      
      // Registrar actividad
      await logActivity('delete_room', 'room', selectedSala.id, {
        roomName: selectedSala.name,
        companyName: selectedSala.companyName
      }, currentUser.uid, userProfile?.displayName, userProfile?.email);

      addNotification('Sala eliminada exitosamente', 'success');
      setDeleteDialogOpen(false);
      setSelectedSala(null);
      
    } catch (error) {
      console.error('Error eliminando sala:', error);
      addNotification('Error al eliminar la sala', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Abrir diálogo de edición
  const handleOpenEdit = (sala) => {
    setSelectedSala(sala);
    setFormData({
      name: sala.name || '',
      companyId: sala.companyId || '',
      companyName: sala.companyName || '',
      proveedorOnline: sala.proveedorOnline || '',
      ciudad: sala.ciudad || '',
      departamento: sala.departamento || '',
      direccion: sala.direccion || '',
      status: sala.status || 'active',
      propietario: sala.propietario || '',
      contactPhone: sala.contactPhone || '',
      contactEmail: sala.contactEmail || '',
      contactoAutorizado: sala.contactoAutorizado || '',
      contactPhone2: sala.contactPhone2 || '',
      contactEmail2: sala.contactEmail2 || '',
      contactoAutorizado2: sala.contactoAutorizado2 || '',
      administracion: sala.administracion || 0,
      conexion: sala.conexion || 0
    });
    setEditDialogOpen(true);
  };

  // Abrir diálogo de vista
  const handleOpenView = (sala) => {
    setSelectedSala(sala);
    setViewDialogOpen(true);
  };

  // Abrir diálogo de eliminación
  const handleOpenDelete = (sala) => {
    setSelectedSala(sala);
    setDeleteDialogOpen(true);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setStatusFilter('all');
    setPropietarioFilter('all');
    setProveedorFilter('all');
  };

  // Obtener color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';  // Verde
      case 'retired': return 'error';   // Rojo
      default: return 'success';
    }
  };

  // Obtener texto de estado
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'retired': return 'Retirada';
      default: return 'Activa';
    }
  };

  // Formatear moneda para inputs dinámicos
  const formatCurrencyInput = (value) => {
    if (value === null || value === undefined || value === '') return '';
    
    // Si ya es un número, convertir a string
    const stringValue = typeof value === 'number' ? value.toString() : value;
    
    // Si es 0, mostrar vacío para mejor UX
    if (stringValue === '0') return '';
    
    const numbers = stringValue.replace(/\D/g, '');
    if (!numbers) return '';
    
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(parseInt(numbers));
    return formatted;
  };

  const parseCurrencyValue = (formattedValue) => {
    if (!formattedValue) return 0;
    return parseInt(formattedValue.replace(/\D/g, '')) || 0;
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700,
                mb: 1,
                color: '#fff'
              }}>
                Gestión de Salas
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <RoomIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                Administra las salas disponibles para cada empresa
              </Typography>
            </Box>
            <Fab
              color="primary"
              onClick={() => setAddDialogOpen(true)}
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05) translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.20)'
                }
              }}
          >
            <AddIcon />
          </Fab>
          </Box>
        </Paper>
      </motion.div>

      {/* Estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              textAlign: 'left', 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                borderColor: alpha(theme.palette.primary.main, 0.3)
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  mb: 1.5
                }}>
                  <RoomIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {salas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Salas Totales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              textAlign: 'left', 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                borderColor: alpha(theme.palette.success.main, 0.3)
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  mb: 1.5
                }}>
                  <StarIcon sx={{ fontSize: 18, color: 'success.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {salas.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Salas Activas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              textAlign: 'left', 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                borderColor: alpha(theme.palette.error.main, 0.3)
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  mb: 1.5
                }}>
                  <BlockIcon sx={{ fontSize: 18, color: 'error.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} color="error.main">
                  {salas.filter(s => s.status === 'retired').length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Salas Retiradas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.2) },
          '&:focus-within': { borderColor: alpha(theme.palette.primary.main, 0.6), boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }
        }}>
          <Typography variant="overline" sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            letterSpacing: 0.8,
            fontSize: '0.75rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 2
          }}>
            <FilterIcon sx={{ fontSize: 16 }} />
            FILTROS DE BÚSQUEDA
          </Typography>
          
          <Grid container spacing={3}>
            {/* Filtro por estado */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos los estados</MenuItem>
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="retired">Retirada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por propietario */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Propietario</InputLabel>
                <Select
                  value={propietarioFilter}
                  onChange={(e) => setPropietarioFilter(e.target.value)}
                  label="Propietario"
                >
                  <MenuItem value="all">Todos los propietarios</MenuItem>
                  {propietariosUnicos.filter(p => p !== 'all').map(propietario => (
                    <MenuItem key={propietario} value={propietario}>
                      {propietario}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por proveedor online */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Proveedor Online</InputLabel>
                <Select
                  value={proveedorFilter}
                  onChange={(e) => setProveedorFilter(e.target.value)}
                  label="Proveedor Online"
                >
                  <MenuItem value="all">Todos los proveedores online</MenuItem>
                  {proveedoresUnicos.filter(p => p !== 'all').map(proveedor => (
                    <MenuItem key={proveedor} value={proveedor}>
                      {proveedor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Limpiar filtros */}
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                sx={{ height: '56px' }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Tabla contextual (solo se muestra cuando hay filtros activos) */}
      <AnimatePresence>
        {(statusFilter !== 'all' || propietarioFilter !== 'all' || proveedorFilter !== 'all') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 2, 
                background: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
              }}>
                <Typography variant="overline" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FilterIcon sx={{ fontSize: 16 }} />
                  RESULTADOS DEL FILTRO ({filteredSalas.length} {filteredSalas.length === 1 ? 'sala' : 'salas'})
                </Typography>
              </Box>
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Empresa</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Sala</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Ciudad</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Propietario</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Proveedor Online</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600, background: theme.palette.background.paper }} align="center">Máquinas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSalas.map((sala, index) => (
                      <TableRow 
                        key={sala.id}
                        sx={{ 
                          '&:hover': { background: alpha(theme.palette.primary.main, 0.04) },
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar 
                              src={companies.find(c => c.id === sala.companyId)?.logoURL}
                              sx={{ width: 24, height: 24, borderRadius: '4px' }}
                            >
                              <BusinessIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {sala.companyName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {sala.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {sala.ciudad || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {sala.propietario || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {sala.proveedorOnline || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sala.status === 'active' ? 'Activa' : 'Retirada'}
                            color={sala.status === 'active' ? 'success' : 'error'}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sala.maquinas || 0}
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              minWidth: 40,
                              height: 20
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separador entre métricas y lista */}
      <Divider sx={{ my: 3, borderColor: alpha(theme.palette.divider, 0.2) }} />

      {/* ✅ NUEVO DISEÑO: Dos Columnas - Empresas (izq) y Salas (der) */}
      <Grid container spacing={3}>
        {/* GRID 1: Lista de Empresas (Lado Izquierdo) */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '720px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" />
                  Empresas
                </Typography>
              </Box>
              
              <Box sx={{ 
                flex: 1,
                overflowY: 'auto',
                px: 2,
                pb: 2,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { 
                  background: 'transparent',
                  marginTop: '4px',
                  marginBottom: '4px'
                },
                '&::-webkit-scrollbar-thumb': { 
                  background: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: '3px',
                  '&:hover': { background: alpha(theme.palette.primary.main, 0.5) }
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {companiesWithSalas.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      onClick={() => setSelectedCompanyId(company.id)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: selectedCompanyId === company.id
                          ? `2px solid ${theme.palette.primary.main}`
                          : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        background: selectedCompanyId === company.id
                          ? alpha(theme.palette.primary.main, 0.08)
                          : theme.palette.background.paper,
                        boxShadow: selectedCompanyId === company.id
                          ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          : '0 2px 8px rgba(0,0,0,0.06)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={company.logoURL}
                            alt={company.name}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '8px',
                              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              '& img': {
                                objectFit: 'contain',
                                padding: '4px'
                              }
                            }}
                          >
                            <BusinessIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {company.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.salasCount} {company.salasCount === 1 ? 'sala' : 'salas'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* GRID 2: Salas de la Empresa Seleccionada (Lado Derecho) */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '720px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {!selectedCompanyId ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}>
                  <Box sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    <RoomIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.4) }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Selecciona una empresa
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Haz clic en una empresa de la lista para ver sus salas
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  {/* Header con título */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RoomIcon color="primary" />
                      Salas de {companies.find(c => c.id === selectedCompanyId)?.name}
                    </Typography>
                    
                    <Chip 
                      label={`${salasDeEmpresaSeleccionada.length} ${salasDeEmpresaSeleccionada.length === 1 ? 'sala' : 'salas'}`}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* ✅ BARRA DE BÚSQUEDA */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar salas por nombre, ciudad, propietario o proveedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton 
                              size="small" 
                              onClick={() => setSearchTerm('')}
                              sx={{ 
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  transform: 'rotate(90deg)',
                                  color: 'error.main' 
                                }
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.4)
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main
                          }
                        }
                      }}
                    />
                  </Box>
                  
                  {salasDeEmpresaSeleccionada.length === 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      py: 8,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        No hay salas para esta empresa
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddDialogOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Agregar Sala
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      flex: 1,
                      overflowY: 'auto',
                      pr: 0.5,
                      mr: -0.5,
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { 
                        background: 'transparent',
                        marginTop: '4px',
                        marginBottom: '4px'
                      },
                      '&::-webkit-scrollbar-thumb': { 
                        background: alpha(theme.palette.primary.main, 0.3),
                        borderRadius: '3px',
                        '&:hover': { background: alpha(theme.palette.primary.main, 0.5) }
                      }
                    }}>
                      <AnimatePresence>
                        <Grid container spacing={2}>
                          {salasDeEmpresaSeleccionada.map((sala, index) => (
            <Grid item xs={12} md={6} lg={4} key={sala.id}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card 
                  sx={{ 
                    minHeight: 310,
                    maxHeight: 310,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      borderColor: alpha(theme.palette.primary.main, 0.25),
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardHeader
                    sx={{
                      minHeight: 85,
                      maxHeight: 85,
                      py: 1.5,
                      px: 2,
                      '& .MuiCardHeader-content': {
                        overflow: 'hidden'
                      }
                    }}
                    avatar={
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}>
                        <RoomIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      </Box>
                    }
                    title={
                      <Typography 
                        variant="h6" 
                        fontWeight="bold"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3
                        }}
                      >
                        {sala.name}
                      </Typography>
                    }
                    action={
                      <Box>
                        <IconButton onClick={() => handleOpenView(sala)}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => handleOpenEdit(sala)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleOpenDelete(sala)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  />
                  
                  <CardContent sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    pt: 1,
                    pb: 1.5,
                    px: 2,
                    '&:last-child': {
                      pb: 1.5
                    }
                  }}>
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={getStatusText(sala.status)}
                        color={getStatusColor(sala.status)}
                        size="small"
                        sx={{ height: 22 }}
                      />
                    </Box>
                    <Box sx={{ mb: 1.5, minHeight: 70 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <LocationIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500
                          }}
                        >
                          {sala.ciudad || 'Sin ciudad'}{sala.departamento && `, ${sala.departamento}`}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        display="block"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          pl: 2.5
                        }}
                      >
                        {sala.direccion || 'Sin dirección'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        display="block"
                        sx={{ 
                          minHeight: 18,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mt: 1,
                          pl: 2.5
                        }}
                      >
                        {sala.propietario ? `Propietario: ${sala.propietario}` : '\u00A0'}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                              Administración
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {formatPrice(sala.administracion || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <MoneyIcon fontSize="small" color="action" />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                              Conexión
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {formatPrice(sala.conexion || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* ELIMINADO: Mensaje cuando no hay salas (ya está integrado arriba) */}
      {false && filteredSalas.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{
            textAlign: 'center',
            py: 6,
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.3)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
            border: `2px dashed ${alpha(theme.palette.divider, 0.15)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.25),
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.1)} 0%, ${alpha(theme.palette.grey[300], 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              <RoomIcon sx={{ 
                fontSize: 24, 
                color: alpha(theme.palette.text.secondary, 0.7)
              }} />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 500,
              mb: 1,
              color: theme.palette.text.primary,
              fontSize: '1rem'
            }}>
              No se encontraron salas
            </Typography>
            <Typography variant="body2" sx={{ 
              color: alpha(theme.palette.text.secondary, 0.8),
              lineHeight: 1.6,
              mb: 2
            }}>
              {salas.length === 0 
                ? 'Comienza agregando tu primera sala de reuniones'
                : 'Intenta ajustar los filtros de búsqueda para encontrar más resultados'
              }
            </Typography>
            <Typography variant="caption" sx={{ 
              color: alpha(theme.palette.text.secondary, 0.6),
              lineHeight: 1.6,
              mb: 3,
              display: 'block'
            }}>
              Utiliza el botón de abajo para crear una nueva sala
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ 
                mt: 1,
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              {salas.length === 0 ? 'Agregar Primera Sala' : 'Agregar Nueva Sala'}
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Modal Agregar Sala */}
      <AddSalaModal
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          clearForm();
        }}
        formData={formData}
        companies={companies}
        salas={salas}
        proveedoresUnicos={proveedoresUnicos}
        contactosUnicos={contactosUnicos}
        propietariosConDatos={propietariosConDatos}
        camaraComercioFile={camaraComercioFile}
        usoSuelosFile={usoSuelosFile}
        saving={saving}
        uploadingFiles={uploadingFiles}
        handleFormChange={handleFormChange}
        handleCiudadChange={handleCiudadChange}
        handlePropietarioChange={handlePropietarioChange}
        handleContactoChange={handleContactoChange}
        handleContacto2Change={handleContacto2Change}
        setCamaraComercioFile={setCamaraComercioFile}
        setUsoSuelosFile={setUsoSuelosFile}
        handleCreateSala={handleCreateSala}
        formatCurrencyInput={formatCurrencyInput}
        parseCurrencyValue={parseCurrencyValue}
        addNotification={addNotification}
      />

      {/* Modal Editar Sala */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedSala(null);
          clearForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`,
            color: 'white',
            textAlign: 'center',
            py: 2.5,
            borderBottom: `3px solid ${theme.palette.warning.main}`,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center">
            <Avatar
              sx={{
                width: 42,
                height: 42,
                mr: 2,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`,
                boxShadow: `0 2px 8px ${theme.palette.warning.main}25`,
              }}
            >
              <EditIcon sx={{ fontSize: 22, color: 'white' }} />
            </Avatar>
            <Box textAlign="left">
              <Typography variant="h5" component="div" fontWeight="600" color="white">
                Editar Sala
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: 'white' }}>
                Modifica la información de la sala
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  mt: 2,
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? `${theme.palette.primary.main}20` 
                    : `${theme.palette.primary.main}08`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'primary.main', 
                      borderRadius: '50%', 
                      p: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <BusinessIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      lineHeight: 1.2
                    }}>
                      Información Básica
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Datos generales de la sala
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la Sala"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
                helperText="Nombre identificativo de la sala"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={companies}
                getOptionLabel={(option) => option.name || ''}
                value={companies.find(c => c.id === formData.companyId) || null}
                onChange={(event, newValue) => {
                  handleFormChange('companyId', newValue?.id || '');
                  handleFormChange('companyName', newValue?.name || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empresa"
                    required
                    helperText="Empresa asociada a la sala (escriba para buscar)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={proveedoresUnicos.filter(p => p !== 'all')}
                value={formData.proveedorOnline ?? ''}
                onChange={(event, newValue) => {
                  handleFormChange('proveedorOnline', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('proveedorOnline', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Proveedor Online"
                    helperText="Proveedor de servicios online (puede escribir nuevo o seleccionar existente)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={[...new Set(salas.map(sala => sala.ciudad).filter(Boolean))]}
                value={formData.ciudad ?? ''}
                onChange={(event, newValue) => {
                  handleCiudadChange(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    handleFormChange('ciudad', newInputValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ciudad"
                    helperText="Ciudad donde se encuentra la sala (el departamento se auto-completa)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={[...new Set(salas.map(sala => sala.departamento).filter(Boolean))]}
                value={formData.departamento ?? ''}
                onChange={(event, newValue) => {
                  handleFormChange('departamento', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('departamento', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Departamento"
                    helperText="Departamento donde se encuentra la sala"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => handleFormChange('direccion', e.target.value)}
                helperText="Dirección completa de la sala"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="retired">Retirada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={propietariosUnicos.filter(p => p !== 'all')}
                value={formData.propietario ?? ''}
                onChange={(event, newValue) => {
                  handleFormChange('propietario', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('propietario', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Propietario"
                    helperText="Propietario de la sala (puede escribir nuevo o seleccionar existente)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Información de Contacto */}
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  mt: 1,
                  borderLeft: `4px solid ${theme.palette.warning.main}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? `${theme.palette.warning.main}20` 
                    : `${theme.palette.warning.main}08`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'warning.main', 
                      borderRadius: '50%', 
                      p: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 'bold',
                      color: 'warning.main',
                      lineHeight: 1.2
                    }}>
                      Información de Contacto
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Datos de contacto principal de la sala
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contacto autorizado"
                value={formData.contactoAutorizado ?? ''}
                onChange={(e) => handleFormChange('contactoAutorizado', e.target.value)}
                helperText="Persona autorizada para contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.contactPhone ?? ''}
                onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                helperText="Número de contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail de contacto"
                type="email"
                value={formData.contactEmail ?? ''}
                onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                helperText="Correo electrónico de contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            {/* Contacto Autorizado 2 */}
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  mt: 1,
                  borderLeft: `4px solid ${theme.palette.info.main}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? `${theme.palette.info.main}20` 
                    : `${theme.palette.info.main}08`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'info.main', 
                      borderRadius: '50%', 
                      p: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PeopleIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 'bold',
                      color: 'info.main',
                      lineHeight: 1.2
                    }}>
                      Contacto Autorizado 2 (Opcional)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Datos de contacto secundario o alternativo
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contacto autorizado 2"
                value={formData.contactoAutorizado2 ?? ''}
                onChange={(e) => handleFormChange('contactoAutorizado2', e.target.value)}
                helperText="Segunda persona autorizada para contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono 2"
                value={formData.contactPhone2 ?? ''}
                onChange={(e) => handleFormChange('contactPhone2', e.target.value)}
                helperText="Número de contacto alternativo"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail de contacto 2"
                type="email"
                value={formData.contactEmail2 ?? ''}
                onChange={(e) => handleFormChange('contactEmail2', e.target.value)}
                helperText="Correo electrónico alternativo"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            {/* Costos Adicionales */}
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  mt: 1,
                  borderLeft: `4px solid ${theme.palette.success.main}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? `${theme.palette.success.main}20` 
                    : `${theme.palette.success.main}08`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'success.main', 
                      borderRadius: '50%', 
                      p: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MoneyIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 'bold',
                      color: 'success.main',
                      lineHeight: 1.2
                    }}>
                      Costos Adicionales
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Costos mensuales adicionales de la sala
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Administración"
                value={formatCurrencyInput(formData.administracion || 0)}
                onChange={(e) => {
                  const numericValue = parseCurrencyValue(e.target.value);
                  handleFormChange('administracion', numericValue);
                }}
                helperText="Costo de administración"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Conexión"
                value={formatCurrencyInput(formData.conexion || 0)}
                onChange={(e) => {
                  const numericValue = parseCurrencyValue(e.target.value);
                  handleFormChange('conexion', numericValue);
                }}
                helperText="Costo de conexión"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedSala(null);
              clearForm();
            }}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditSala}
            variant="contained"
            disabled={saving}
            startIcon={<SaveIcon />}
            sx={{ borderRadius: 2 }}
          >
            {saving ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Guardando...
              </Box>
            ) : (
              'Actualizar Sala'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Ver Sala */}
      <ViewSalaModal
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedSala(null);
        }}
        selectedSala={selectedSala}
        onEdit={() => {
          setViewDialogOpen(false);
          handleOpenEdit(selectedSala);
        }}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
      />

      {/* Modal Eliminar Sala */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedSala(null);
        }}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.9) 
              : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          pt: 3,
          px: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
              <DeleteIcon sx={{ fontSize: 24, color: 'error.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Eliminar Sala
              </Typography>
              <Typography variant="body2" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                mt: 0.5 
              }}>
                Esta acción no se puede deshacer
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {selectedSala && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Está seguro que desea eliminar la sala <strong>"{selectedSala.name}"</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta acción eliminará permanentemente:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Toda la información de la sala" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Configuración de amenidades" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Estadísticas asociadas" />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Si esta sala tiene reservas o liquidaciones asociadas, podría afectar otros módulos del sistema.
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedSala(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteSala}
            variant="contained"
            color="error"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {saving ? 'Eliminando...' : 'Eliminar Sala'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalasPage;

