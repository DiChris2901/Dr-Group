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
  Switch
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
  Clear as ClearIcon
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
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  
  // Formulario para nueva/editar sala
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    companyName: '',
    proveedorOnline: '',
    ciudad: '',
    status: 'active',
    propietario: '',
    contactPhone: '',
    contactEmail: '',
    contactoAutorizado: '',
    administracion: 0,
    conexion: 0
  });



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
    const matchesSearch = sala.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sala.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sala.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || sala.companyId === companyFilter;
    const matchesStatus = statusFilter === 'all' || sala.status === statusFilter;
    
    return matchesSearch && matchesCompany && matchesStatus;
  });

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



  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      companyId: '',
      companyName: '',
      proveedorOnline: '',
      ciudad: '',
      status: 'active',
      propietario: '',
      contactPhone: '',
      contactEmail: '',
      contactoAutorizado: '',
      administracion: 0,
      conexion: 0
    });
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
      
      // Registrar actividad
      await logActivity('create_room', 'room', docRef.id, {
        roomName: formData.name,
        companyName: formData.companyName,
        proveedorOnline: formData.proveedorOnline,
        ciudad: formData.ciudad
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
          capacity: formData.capacity,
          hourlyRate: formData.hourlyRate,
          status: formData.status
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
      status: sala.status || 'active',
      propietario: sala.propietario || '',
      contactPhone: sala.contactPhone || '',
      contactEmail: sala.contactEmail || '',
      contactoAutorizado: sala.contactoAutorizado || '',
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
    setSearchTerm('');
    setCompanyFilter('all');
    setStatusFilter('all');
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
            {/* Búsqueda */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar salas"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Filtro por empresa */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  label="Empresa"
                >
                  <MenuItem value="all">Todas las empresas</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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

            {/* Limpiar filtros */}
            <Grid item xs={12} md={2}>
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

      {/* Estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
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
                  {filteredSalas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Salas Totales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
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
                  {filteredSalas.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Salas Activas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'left', 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                borderColor: alpha(theme.palette.info.main, 0.3)
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  mb: 1.5
                }}>
                  <PeopleIcon sx={{ fontSize: 18, color: 'info.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} color="info.main">
                  {Math.round(filteredSalas.reduce((acc, sala) => acc + sala.capacity, 0) / Math.max(filteredSalas.length, 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Capacidad Promedio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'left', 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                borderColor: alpha(theme.palette.warning.main, 0.3)
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  mb: 1.5
                }}>
                  <MoneyIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                </Box>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {formatPrice(filteredSalas.reduce((acc, sala) => acc + sala.hourlyRate, 0) / Math.max(filteredSalas.length, 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Tarifa Promedio/Hora
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Separador entre métricas y lista */}
      <Divider sx={{ my: 3, borderColor: alpha(theme.palette.divider, 0.2) }} />

      {/* Lista de Salas */}
      <Box sx={{ mt: 2 }}>
      <AnimatePresence>
        <Grid container spacing={3}>
          {filteredSalas.map((sala, index) => (
            <Grid item xs={12} md={6} lg={4} key={sala.id}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
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
                      <Typography variant="h6" fontWeight="bold">
                        {sala.name}
                      </Typography>
                    }
                    subheader={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {sala.companyName}
                        </Typography>
                        <Chip 
                          label={getStatusText(sala.status)}
                          color={getStatusColor(sala.status)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
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
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {sala.description || 'Sin descripción'}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {sala.capacity} personas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <MoneyIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatPrice(sala.hourlyRate)}/h
                          </Typography>
                        </Box>
                      </Grid>
                      {sala.location && (
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {sala.location}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>

                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>
      </Box>

      {/* Mensaje cuando no hay salas */}
      {filteredSalas.length === 0 && (
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
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
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
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          pt: 3,
          px: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
        }}>
          <Box display="flex" alignItems="center" gap={3} sx={{ mb: 1 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
              <AddIcon sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Agregar Nueva Sala
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Complete la información de la nueva sala
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Grid container spacing={3.5}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 600,
                letterSpacing: 1.2,
                mb: 2,
                display: 'block'
              }}>
                Información Básica
              </Typography>
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
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5
                }
              }}>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(e) => handleFormChange('companyId', e.target.value)}
                  label="Empresa"
                >
                  {companies.map(company => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Proveedor Online"
                value={formData.proveedorOnline ?? ''}
                onChange={(e) => handleFormChange('proveedorOnline', e.target.value)}
                helperText="Proveedor de servicios online"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.ciudad ?? ''}
                onChange={(e) => handleFormChange('ciudad', e.target.value)}
                helperText="Ciudad donde se encuentra la sala"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5
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
              <TextField
                fullWidth
                label="Propietario"
                value={formData.propietario ?? ''}
                onChange={(e) => handleFormChange('propietario', e.target.value)}
                helperText="Propietario de la sala"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            {/* Información de Contacto */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 600,
                letterSpacing: 1.2,
                mb: 2,
                mt: 2,
                display: 'block'
              }}>
                Información de Contacto
              </Typography>
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
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.contactPhone}
                onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                helperText="Número de contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail de contacto"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                helperText="Correo electrónico de contacto"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
            
            {/* Costos Adicionales */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 600,
                letterSpacing: 1.2,
                mb: 2,
                mt: 2,
                display: 'block'
              }}>
                Costos Adicionales
              </Typography>
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
                    borderRadius: 1.5
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
                    borderRadius: 1.5
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              clearForm();
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSala}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Crear Sala'}
          </Button>
        </DialogActions>
      </Dialog>

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
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
        }}>
          <Box display="flex" alignItems="center" gap={3} sx={{ mb: 1 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            }}>
              <EditIcon sx={{ fontSize: 24, color: 'warning.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Editar Sala
              </Typography>
              <Typography variant="body2" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                mt: 0.5 
              }}>
                Modifique la información de la sala
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Grid container spacing={3.5}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 600,
                letterSpacing: 1.2,
                mb: 2,
                display: 'block'
              }}>
                Información Básica
              </Typography>
            </Grid>
            
            {/* Mismos campos que en agregar, pero con valores del formData */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la Sala"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(e) => handleFormChange('companyId', e.target.value)}
                  label="Empresa"
                >
                  {companies.map(company => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacidad"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleFormChange('capacity', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">personas</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tarifa por Hora"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleFormChange('hourlyRate', parseInt(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ubicación"
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
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
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Persona de Contacto"
                value={formData.contactPerson}
                onChange={(e) => handleFormChange('contactPerson', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Teléfono de Contacto"
                value={formData.contactPhone}
                onChange={(e) => handleFormChange('contactPhone', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email de Contacto"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFormChange('contactEmail', e.target.value)}
              />
            </Grid>

          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedSala(null);
              clearForm();
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditSala}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Actualizar Sala'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Ver Sala */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedSala(null);
        }}
        maxWidth="md"
        fullWidth
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
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <VisibilityIcon sx={{ fontSize: 24, color: 'info.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Detalles de la Sala
              </Typography>
              <Typography variant="body2" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                mt: 0.5 
              }}>
                Información completa de la sala
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {selectedSala && (
            <Grid container spacing={3}>
              {/* Información principal */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {selectedSala.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {selectedSala.companyName}
                  </Typography>
                  <Chip 
                    label={getStatusText(selectedSala.status)}
                    color={getStatusColor(selectedSala.status)}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
              
              {/* Descripción */}
              {selectedSala.description && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Descripción
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedSala.description}
                  </Typography>
                </Grid>
              )}
              
              {/* Detalles técnicos */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información Técnica
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Capacidad"
                      secondary={`${selectedSala.capacity} personas`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Tarifa por Hora"
                      secondary={formatPrice(selectedSala.hourlyRate)}
                    />
                  </ListItem>
                  {selectedSala.location && (
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Ubicación"
                        secondary={selectedSala.location}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              {/* Información de contacto */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Contacto
                </Typography>
                <List>
                  {selectedSala.contactPerson && (
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Responsable"
                        secondary={selectedSala.contactPerson}
                      />
                    </ListItem>
                  )}
                  {selectedSala.contactPhone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Teléfono"
                        secondary={selectedSala.contactPhone}
                      />
                    </ListItem>
                  )}
                  {selectedSala.contactEmail && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email"
                        secondary={selectedSala.contactEmail}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              {/* Metadatos */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Creada el {selectedSala.createdAt ? format(selectedSala.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Fecha no disponible'}
                  {selectedSala.updatedAt && selectedSala.updatedAt !== selectedSala.createdAt && (
                    <> • Última actualización: {format(selectedSala.updatedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}</>
                  )}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setViewDialogOpen(false);
              setSelectedSala(null);
            }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              setViewDialogOpen(false);
              handleOpenEdit(selectedSala);
            }}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Editar Sala
          </Button>
        </DialogActions>
      </Dialog>

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