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
  Fab
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
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Security as SecurityIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';

const CompaniesPage = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const theme = useTheme();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulario para nueva empresa
  const [formData, setFormData] = useState({
    name: '',
    nit: '',
    email: '',
    legalRepresentative: '',
    legalRepresentativeId: '',
    contractNumber: '',
    logoURL: '',
    platforms: {
      coljuegos: {
        username: '',
        password: '',
        link: ''
      },
      houndoc: {
        username: '',
        password: '',
        link: ''
      },
      dian: {
        nit: '',
        cedula: '',
        password: '',
        link: ''
      },
      supersalud: {
        username: '',
        password: '',
        link: ''
      }
    }
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Función para obtener colores dinámicos basados en el tema
  const getThemeColor = (colorName) => {
    return theme.palette.mode === 'dark' 
      ? theme.palette[colorName]?.dark || theme.palette[colorName]?.main 
      : theme.palette[colorName]?.main;
  };

  // Cargar empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });

        setCompanies(companiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        setError('Error al cargar las empresas');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const fieldParts = field.split('.');
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (fieldParts.length === 3) {
        const [parent, child, grandchild] = fieldParts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      nit: '',
      email: '',
      legalRepresentative: '',
      legalRepresentativeId: '',
      contractNumber: '',
      logoURL: '',
      platforms: {
        coljuegos: {
          username: '',
          password: '',
          link: 'https://tramiteagil.coljuegos.gov.co/PortalOperador/Coljuegos/index.xhtml'
        },
        houndoc: {
          username: '',
          password: '',
          link: 'https://app.ia.coljuegos.gov.co/login?p=/'
        },
        dian: {
          nit: '',
          cedula: '',
          password: '',
          link: 'https://muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=eyJjbGllbnRJZCI6IldvMGFLQWxCN3ZSUF8xNmZyUEkxeDlacGhCRWEiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbXVpc2NhLmRpYW4uZ292LmNvL0lkZW50aWRhZFJlc3RfTG9naW5GaWx0cm8vYXBpL3N0cy92MS9hdXRoL2NhbGxiYWNrP3JlZGlyZWN0X3VyaT1odHRwJTNBJTJGJTJGbXVpc2NhLmRpYW4uZ292LmNvJTJGV2ViQXJxdWl0ZWN0dXJhJTJGRGVmTG9naW4uZmFjZXMiLCJyZXNwb25zZVR5cGUiOiIiLCJzY29wZSI6IiIsInN0YXRlIjoiIiwibm9uY2UiOiIiLCJwYXJhbXMiOnsidGlwb1VzdWFyaW8iOiJtdWlzY2EifX0%3D'
        },
        supersalud: {
          username: '',
          password: '',
          link: 'https://b2csupersalud.b2clogin.com/fde7cdd3-9370-4490-b315-57832145013a/b2c_1_flujoregistroiniciosesion/oauth2/v2.0/authorize?client_id=e23d6426-30f1-4866-a797-6ed7ddb8089f&redirect_uri=https%3A%2F%2Fgenesis.supersalud.gov.co%2Fsignin-oidc&response_type=id_token&scope=openid%20profile&response_mode=form_post&nonce=638887962152960111.YzdhY2QzZWEtMDAzYy00ODFmLWI4Y2QtYWYyMTc1YjFiMjg2OGRhM2NlOWYtNGFiOC00NWVkLWFlNGQtZDUzZTFjYjE3NjEw&state=CfDJ8MfFcOGZZ7lHsmJHkd_eXvjuIuiWf47YLURdXVhg6KMM1oHoijRv4EwqZp_O4ik34j4ksMr7YZUy6JUfK0zBqEtonpoBUOjwYMz-4QOwD9EIIsjSfS8dq0Fn1NmclaWVKXHEvqobxPPKeGMjFJqK2hXfTA375uF2ZEeMb0iJ4nPbbsAFo_bmrkAhuxoh70jgfIl9uRwmN_ubfvc46VHg1m2DnEp_J6h6NKeF9hoKBfsAj2Yqy_f8GhkypKCzvKUzcBpMkIYZTJAhtbusO1qCo2fKF8ZQV9FwaLhPXXfwxM0WdKb_to_vlAoLsh40VqBbivbsQwmfSgix1KxrbRf7uonCRpuB7ED2CWDNBvrjDBjC&x-client-SKU=ID_NETSTANDARD2_0&x-client-ver=5.3.0.0'
        }
      }
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Manejar selección de archivo de logotipo
  const handleLogoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Archivo inválido',
          message: 'Por favor selecciona un archivo de imagen válido',
          icon: 'error',
          color: 'error'
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'Archivo muy grande',
          message: 'El archivo debe ser menor a 5MB',
          icon: 'error',
          color: 'error'
        });
        return;
      }

      setLogoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir logotipo a Firebase Storage
  const uploadLogo = async () => {
    if (!logoFile) return null;

    setUploadingLogo(true);
    try {
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `logos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setUploadingLogo(false);
    }
  };

  // Abrir diálogo de agregar empresa
  const handleAddCompany = () => {
    clearForm();
    setAddDialogOpen(true);
  };

  // Abrir diálogo de editar empresa
  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name || '',
      nit: company.nit || '',
      email: company.email || '',
      legalRepresentative: company.legalRepresentative || '',
      legalRepresentativeId: company.legalRepresentativeId || '',
      contractNumber: company.contractNumber || '',
      logoURL: company.logoURL || '',
      platforms: {
        coljuegos: {
          username: company.platforms?.coljuegos?.username || '',
          password: company.platforms?.coljuegos?.password || '',
          link: company.platforms?.coljuegos?.link || ''
        },
        houndoc: {
          username: company.platforms?.houndoc?.username || '',
          password: company.platforms?.houndoc?.password || '',
          link: company.platforms?.houndoc?.link || ''
        },
        dian: {
          nit: company.platforms?.dian?.nit || '',
          cedula: company.platforms?.dian?.cedula || '',
          password: company.platforms?.dian?.password || '',
          link: company.platforms?.dian?.link || ''
        },
        supersalud: {
          username: company.platforms?.supersalud?.username || '',
          password: company.platforms?.supersalud?.password || '',
          link: company.platforms?.supersalud?.link || ''
        }
      }
    });
    setLogoPreview(company.logoURL || null);
    setEditDialogOpen(true);
  };

  // Ver detalles de empresa
  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setViewDialogOpen(true);
  };

  // Guardar empresa (nueva o editada)
  const handleSaveCompany = async () => {
    if (!formData.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El nombre de la empresa es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    if (!formData.nit.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El NIT es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      let logoURL = formData.logoURL;

      // Subir logotipo si hay uno nuevo
      if (logoFile) {
        logoURL = await uploadLogo();
      }

      const companyData = {
        ...formData,
        logoURL,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      if (selectedCompany) {
        // Editar empresa existente
        await updateDoc(doc(db, 'companies', selectedCompany.id), companyData);
        addNotification({
          type: 'success',
          title: 'Empresa actualizada',
          message: `Se actualizó exitosamente "${formData.name}"`,
          icon: 'success',
          color: 'success'
        });
        setEditDialogOpen(false);
      } else {
        // Crear nueva empresa
        await addDoc(collection(db, 'companies'), {
          ...companyData,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        });
        addNotification({
          type: 'success',
          title: 'Empresa creada',
          message: `Se creó exitosamente "${formData.name}"`,
          icon: 'success',
          color: 'success'
        });
        setAddDialogOpen(false);
      }

      clearForm();
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error saving company:', error);
      addNotification({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar la empresa. Inténtalo de nuevo.',
        icon: 'error',
        color: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar empresa
  const handleDeleteCompany = async (company) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la empresa "${company.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'companies', company.id));
        addNotification({
          type: 'delete',
          title: 'Empresa eliminada',
          message: `Se eliminó exitosamente "${company.name}"`,
          icon: 'delete',
          color: 'error'
        });
      } catch (error) {
        console.error('Error deleting company:', error);
        addNotification({
          type: 'error',
          title: 'Error al eliminar',
          message: `No se pudo eliminar "${company.name}". Inténtalo de nuevo.`,
          icon: 'error',
          color: 'error'
        });
      }
    }
  };

  // Cerrar diálogos
  const handleCloseDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setViewDialogOpen(false);
    setSelectedCompany(null);
    clearForm();
  };

  // Función para abrir enlaces
  const handleOpenLink = (url, platformName) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      addNotification({
        type: 'info',
        title: 'Enlace abierto',
        message: `Se abrió el enlace de ${platformName} en una nueva pestaña`,
        icon: 'info',
        color: 'info'
      });
    }
  };

  // Función para copiar al portapapeles
  const handleCopyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        title: 'Copiado',
        message: `${label} copiado al portapapeles`,
        icon: 'copy',
        color: 'success'
      });
    } catch (error) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addNotification({
          type: 'success',
          title: 'Copiado',
          message: `${label} copiado al portapapeles`,
          icon: 'copy',
          color: 'success'
        });
      } catch (fallbackError) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo copiar al portapapeles',
          icon: 'error',
          color: 'error'
        });
      }
      document.body.removeChild(textArea);
    }
  };

  // Componente para mostrar enlaces como botones
  const LinkButton = ({ url, platformName, color = 'primary' }) => {
    if (!url) return null;
    
    return (
      <Button
        variant="outlined"
        size="small"
        color={color}
        startIcon={<LinkIcon />}
        endIcon={<OpenInNewIcon />}
        onClick={() => handleOpenLink(url, platformName)}
        sx={{ 
          textTransform: 'none',
          borderRadius: 2,
          mt: 0.5
        }}
      >
        Abrir {platformName}
      </Button>
    );
  };

  // Componente para mostrar texto con botón de copiado
  const CopyableText = ({ text, label, showValue = true }) => {
    if (!text) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.875rem' }}>
          {showValue ? text : '••••••••'}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={() => handleCopyToClipboard(text, label)}
          sx={{
            minWidth: 'auto',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
            textTransform: 'none'
          }}
        >
          Copiar
        </Button>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header con botón de agregar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Empresas
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCompany}
            sx={{ borderRadius: 2 }}
          >
            Nueva Empresa
          </Button>
        </Box>
      </Box>

      {/* Lista de empresas */}
      {companies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <BusinessIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay empresas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Comienza agregando la primera empresa del grupo
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCompany}
              >
                Agregar Primera Empresa
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company, index) => (
            <Grid item xs={12} sm={6} md={4} key={company.id}>
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
                          label="Empresa"
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewCompany(company)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditCompany(company)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteCompany(company)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Logotipo y nombre */}
                    <Box display="flex" alignItems="center" mb={2}>
                      {company.logoURL ? (
                        <Box
                          sx={{
                            width: 60,
                            height: 40,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 0.5,
                            backgroundColor: 'background.paper'
                          }}
                        >
                          <Box
                            component="img"
                            src={company.logoURL}
                            alt={`Logo de ${company.name}`}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </Box>
                      ) : (
                        <Avatar 
                          sx={{ 
                            width: 50, 
                            height: 50, 
                            mr: 2, 
                            bgcolor: 'primary.main',
                            fontSize: 18,
                            fontWeight: 'bold'
                          }}
                        >
                          {company.name.charAt(0)}
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                          {company.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          NIT: {company.nit}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Información principal */}
                    {company.email && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {company.email}
                        </Typography>
                      </Box>
                    )}

                    {company.legalRepresentative && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {company.legalRepresentative}
                        </Typography>
                      </Box>
                    )}

                    {company.legalRepresentativeId && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          CC: {company.legalRepresentativeId}
                        </Typography>
                      </Box>
                    )}

                    {company.contractNumber && (
                      <Box display="flex" alignItems="center">
                        <ReceiptIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Contrato: {company.contractNumber}
                        </Typography>
                      </Box>
                    )}

                    {/* Enlaces rápidos a plataformas */}
                    {(company.platforms?.coljuegos?.link || 
                      company.platforms?.houndoc?.link || 
                      company.platforms?.dian?.link || 
                      company.platforms?.supersalud?.link) && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 'medium' }}>
                          Accesos Rápidos:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {company.platforms?.coljuegos?.link && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenLink(company.platforms.coljuegos.link, 'Coljuegos')}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.3,
                                px: 1,
                                minWidth: 'auto',
                                borderRadius: 1
                              }}
                            >
                              Coljuegos
                            </Button>
                          )}
                          {company.platforms?.houndoc?.link && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenLink(company.platforms.houndoc.link, 'Houndoc')}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.3,
                                px: 1,
                                minWidth: 'auto',
                                borderRadius: 1
                              }}
                            >
                              Houndoc
                            </Button>
                          )}
                          {company.platforms?.dian?.link && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenLink(company.platforms.dian.link, 'DIAN')}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.3,
                                px: 1,
                                minWidth: 'auto',
                                borderRadius: 1
                              }}
                            >
                              DIAN
                            </Button>
                          )}
                          {company.platforms?.supersalud?.link && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenLink(company.platforms.supersalud.link, 'Supersalud')}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.3,
                                px: 1,
                                minWidth: 'auto',
                                borderRadius: 1
                              }}
                            >
                              Supersalud
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB para agregar empresa en móvil */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddCompany}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Diálogo para agregar/editar empresa */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onClose={handleCloseDialogs}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            minHeight: '85vh',
            maxHeight: '95vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: getThemeColor('primary'),
            color: 'white',
            textAlign: 'center',
            py: 2
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center">
            <BusinessIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              {selectedCompany ? 'Editar Empresa' : 'Nueva Empresa'}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9, fontSize: '0.85rem' }}>
            {selectedCompany ? 'Modifica la información de la empresa' : 'Completa los datos para registrar una nueva empresa'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2, overflow: 'auto', maxHeight: 'calc(95vh - 180px)' }}>
          <Box sx={{ pt: 0.5 }}>
            <Grid container spacing={2}>
              {/* Sección de Logotipo */}
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    mb: 1.5,
                    background: getThemeColor('primary'),
                    color: 'white'
                  }}
                >
                  <CardHeader
                    avatar={<ImageIcon sx={{ color: 'white', fontSize: 20 }} />}
                    title="Logotipo de la Empresa"
                    titleTypographyProps={{ 
                      variant: 'subtitle1', 
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                    sx={{ pb: 0.5, pt: 1.5 }}
                  />
                  <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Box sx={{ mb: 1.5 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="logo-upload"
                        type="file"
                        onChange={handleLogoSelect}
                      />
                      <label htmlFor="logo-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploadingLogo}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            border: '2px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.25)',
                              border: '2px solid rgba(255,255,255,0.5)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.6)',
                              border: '2px solid rgba(255,255,255,0.2)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {logoPreview ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                        </Button>
                      </label>
                      {logoPreview && (
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
                          <Paper
                            elevation={3}
                            sx={{
                              width: 100,
                              height: 60,
                              mr: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderRadius: 2,
                              p: 0.5,
                              backgroundColor: 'white'
                            }}
                          >
                            <Box
                              component="img"
                              src={logoPreview}
                              alt="Vista previa del logo"
                              sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </Paper>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
                            Vista previa del logotipo
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información Básica de la Empresa */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mb: 1.5 }}>
                  <CardHeader
                    avatar={
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
                    }
                    title="Información Básica"
                    subheader="Datos generales de la empresa"
                    titleTypographyProps={{ 
                      variant: 'subtitle1', 
                      fontWeight: 'bold',
                      color: 'primary.main'
                    }}
                    subheaderTypographyProps={{
                      variant: 'caption'
                    }}
                    sx={{ pb: 0.5, pt: 1.5 }}
                  />
                  <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Nombre de la Empresa"
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="NIT"
                          value={formData.nit}
                          onChange={(e) => handleFormChange('nit', e.target.value)}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Correo Electrónico"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Representante Legal"
                          value={formData.legalRepresentative}
                          onChange={(e) => handleFormChange('legalRepresentative', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Cédula Rep Legal"
                          value={formData.legalRepresentativeId}
                          onChange={(e) => handleFormChange('legalRepresentativeId', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Número de Contrato"
                          value={formData.contractNumber}
                          onChange={(e) => handleFormChange('contractNumber', e.target.value)}
                          variant="outlined"
                          placeholder="Ej: CT-2025-001"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Accesos a Plataformas */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mb: 1 }}>
                  <CardHeader
                    avatar={
                      <Box 
                        sx={{ 
                          backgroundColor: 'secondary.main', 
                          borderRadius: '50%', 
                          p: 0.8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <SecurityIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                    }
                    title="Accesos a Plataformas"
                    subheader="Credenciales para sistemas externos"
                    titleTypographyProps={{ 
                      variant: 'subtitle1', 
                      fontWeight: 'bold',
                      color: 'secondary.main'
                    }}
                    subheaderTypographyProps={{
                      variant: 'caption'
                    }}
                    sx={{ pb: 0.5, pt: 1.5 }}
                  />
                  <CardContent sx={{ pt: 0, pb: 1.5 }}>
                    <Grid container spacing={2}>
                      {/* Coljuegos */}
                      <Grid item xs={12}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 1.5, 
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? `${theme.palette.primary.main}20` 
                              : `${theme.palette.primary.main}08`
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1.5
                            }}
                          >
                            <AccountBalanceIcon sx={{ mr: 1, fontSize: 18 }} />
                            Coljuegos
                          </Typography>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Usuario Coljuegos"
                                value={formData.platforms.coljuegos.username}
                                onChange={(e) => handleFormChange('platforms.coljuegos.username', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Contraseña Coljuegos"
                                type="password"
                                value={formData.platforms.coljuegos.password}
                                onChange={(e) => handleFormChange('platforms.coljuegos.password', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Link Coljuegos"
                                value={formData.platforms.coljuegos.link}
                                onChange={(e) => handleFormChange('platforms.coljuegos.link', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>

                      {/* Houndoc */}
                      <Grid item xs={12}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 1.5, 
                            borderLeft: `4px solid ${theme.palette.secondary.main}`,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? `${theme.palette.secondary.main}20` 
                              : `${theme.palette.secondary.main}08`
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: theme.palette.secondary.main,
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1.5
                            }}
                          >
                            <DescriptionIcon sx={{ mr: 1, fontSize: 18 }} />
                            Houndoc
                          </Typography>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Usuario Houndoc"
                                value={formData.platforms.houndoc.username}
                                onChange={(e) => handleFormChange('platforms.houndoc.username', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Contraseña Houndoc"
                                type="password"
                                value={formData.platforms.houndoc.password}
                                onChange={(e) => handleFormChange('platforms.houndoc.password', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Link Houndoc"
                                value={formData.platforms.houndoc.link}
                                onChange={(e) => handleFormChange('platforms.houndoc.link', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>

                      {/* DIAN */}
                      <Grid item xs={12}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 1.5, 
                            borderLeft: `4px solid ${theme.palette.warning.main}`,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? `${theme.palette.warning.main}20` 
                              : `${theme.palette.warning.main}08`
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: theme.palette.warning.main,
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1.5
                            }}
                          >
                            <AccountBalanceIcon sx={{ mr: 1, fontSize: 18 }} />
                            DIAN
                          </Typography>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="NIT DIAN"
                                value={formData.platforms.dian.nit}
                                onChange={(e) => handleFormChange('platforms.dian.nit', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Cédula DIAN"
                                value={formData.platforms.dian.cedula}
                                onChange={(e) => handleFormChange('platforms.dian.cedula', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Contraseña DIAN"
                                type="password"
                                value={formData.platforms.dian.password}
                                onChange={(e) => handleFormChange('platforms.dian.password', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Link DIAN"
                                value={formData.platforms.dian.link}
                                onChange={(e) => handleFormChange('platforms.dian.link', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>

                      {/* Supersalud */}
                      <Grid item xs={12}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 1.5, 
                            borderLeft: `4px solid ${theme.palette.error.main}`,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? `${theme.palette.error.main}20` 
                              : `${theme.palette.error.main}08`
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: theme.palette.error.main,
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1.5
                            }}
                          >
                            <SecurityIcon sx={{ mr: 1, fontSize: 18 }} />
                            Supersalud
                          </Typography>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Usuario Supersalud"
                                value={formData.platforms.supersalud.username}
                                onChange={(e) => handleFormChange('platforms.supersalud.username', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Contraseña Supersalud"
                                type="password"
                                value={formData.platforms.supersalud.password}
                                onChange={(e) => handleFormChange('platforms.supersalud.password', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Link Supersalud"
                                value={formData.platforms.supersalud.link}
                                onChange={(e) => handleFormChange('platforms.supersalud.link', e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900] 
            : theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button 
            onClick={handleCloseDialogs} 
            startIcon={<CancelIcon />}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 2,
              py: 0.8
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveCompany} 
            variant="contained" 
            startIcon={saving ? null : <SaveIcon />}
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              px: 2,
              py: 0.8,
              background: getThemeColor('primary'),
              '&:hover': {
                background: getThemeColor('primary'),
                opacity: 0.9
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              }
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1, color: 'white' }} />
                Guardando...
              </>
            ) : (
              selectedCompany ? 'Actualizar Empresa' : 'Crear Empresa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de vista detallada */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedCompany && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Detalles de {selectedCompany.name}
                </Typography>
                <Chip
                  label="Empresa"
                  color="primary"
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Logotipo si existe */}
              {selectedCompany.logoURL && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    component="img"
                    src={selectedCompany.logoURL}
                    alt={`Logo de ${selectedCompany.name}`}
                    sx={{
                      maxWidth: 200,
                      maxHeight: 120,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1,
                      backgroundColor: 'background.paper',
                      boxShadow: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Logotipo de {selectedCompany.name}
                  </Typography>
                </Box>
              )}

              {/* Información Básica en Grid Horizontal */}
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                Información Básica
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Primera fila */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Empresa
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedCompany.name}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      NIT
                    </Typography>
                    <Typography variant="body1">
                      {selectedCompany.nit || 'No especificado'}
                    </Typography>
                  </Card>
                </Grid>

                {selectedCompany.email && (
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Email
                      </Typography>
                      <Typography variant="body1" noWrap>
                        {selectedCompany.email}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {/* Segunda fila - Información del Representante Legal y Contrato */}
                {(selectedCompany.legalRepresentative || selectedCompany.legalRepresentativeId || selectedCompany.contractNumber) && (
                  <>
                    {selectedCompany.legalRepresentative && (
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Representante Legal
                          </Typography>
                          <Typography variant="body1">
                            {selectedCompany.legalRepresentative}
                          </Typography>
                        </Card>
                      </Grid>
                    )}

                    {selectedCompany.legalRepresentativeId && (
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Cédula Rep Legal
                          </Typography>
                          <Typography variant="body1">
                            {selectedCompany.legalRepresentativeId}
                          </Typography>
                        </Card>
                      </Grid>
                    )}

                    {selectedCompany.contractNumber && (
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            <ReceiptIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Número de Contrato
                          </Typography>
                          <Typography variant="body1">
                            {selectedCompany.contractNumber}
                          </Typography>
                        </Card>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>

              {/* Accesos a Plataformas en Grid Compacto */}
              {(selectedCompany.platforms?.coljuegos?.username || 
                selectedCompany.platforms?.houndoc?.username || 
                selectedCompany.platforms?.dian?.nit || 
                selectedCompany.platforms?.supersalud?.username) && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon />
                    Accesos a Plataformas
                  </Typography>

                  <Grid container spacing={2}>
                    {/* Coljuegos */}
                    {selectedCompany.platforms?.coljuegos?.username && (
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            borderLeft: 4,
                            borderLeftColor: 'primary.main'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            Coljuegos
                          </Typography>
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Usuario
                            </Typography>
                            <CopyableText 
                              text={selectedCompany.platforms.coljuegos.username}
                              label="Usuario de Coljuegos"
                            />
                          </Box>

                          {selectedCompany.platforms.coljuegos.password && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Contraseña
                              </Typography>
                              <CopyableText 
                                text={selectedCompany.platforms.coljuegos.password}
                                label="Contraseña de Coljuegos"
                                showValue={false}
                              />
                            </Box>
                          )}

                          {selectedCompany.platforms.coljuegos.link && (
                            <Box sx={{ mt: 2 }}>
                              <LinkButton 
                                url={selectedCompany.platforms.coljuegos.link}
                                platformName="Coljuegos"
                                color="primary"
                              />
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    )}

                    {/* Houndoc */}
                    {selectedCompany.platforms?.houndoc?.username && (
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            borderLeft: 4,
                            borderLeftColor: 'secondary.main'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                            Houndoc
                          </Typography>
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Usuario
                            </Typography>
                            <CopyableText 
                              text={selectedCompany.platforms.houndoc.username}
                              label="Usuario de Houndoc"
                            />
                          </Box>

                          {selectedCompany.platforms.houndoc.password && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Contraseña
                              </Typography>
                              <CopyableText 
                                text={selectedCompany.platforms.houndoc.password}
                                label="Contraseña de Houndoc"
                                showValue={false}
                              />
                            </Box>
                          )}

                          {selectedCompany.platforms.houndoc.link && (
                            <Box sx={{ mt: 2 }}>
                              <LinkButton 
                                url={selectedCompany.platforms.houndoc.link}
                                platformName="Houndoc"
                                color="secondary"
                              />
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    )}

                    {/* DIAN */}
                    {selectedCompany.platforms?.dian?.nit && (
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            borderLeft: 4,
                            borderLeftColor: 'warning.main'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" color="warning.main" gutterBottom>
                            DIAN
                          </Typography>
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              NIT
                            </Typography>
                            <CopyableText 
                              text={selectedCompany.platforms.dian.nit}
                              label="NIT de DIAN"
                            />
                          </Box>

                          {selectedCompany.platforms.dian.cedula && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Cédula
                              </Typography>
                              <CopyableText 
                                text={selectedCompany.platforms.dian.cedula}
                                label="Cédula de DIAN"
                              />
                            </Box>
                          )}

                          {selectedCompany.platforms.dian.password && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Contraseña
                              </Typography>
                              <CopyableText 
                                text={selectedCompany.platforms.dian.password}
                                label="Contraseña de DIAN"
                                showValue={false}
                              />
                            </Box>
                          )}

                          {selectedCompany.platforms.dian.link && (
                            <Box sx={{ mt: 2 }}>
                              <LinkButton 
                                url={selectedCompany.platforms.dian.link}
                                platformName="DIAN"
                                color="warning"
                              />
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    )}

                    {/* Supersalud */}
                    {selectedCompany.platforms?.supersalud?.username && (
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            borderLeft: 4,
                            borderLeftColor: 'error.main'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
                            Supersalud
                          </Typography>
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Usuario
                            </Typography>
                            <CopyableText 
                              text={selectedCompany.platforms.supersalud.username}
                              label="Usuario de Supersalud"
                            />
                          </Box>

                          {selectedCompany.platforms.supersalud.password && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Contraseña
                              </Typography>
                              <CopyableText 
                                text={selectedCompany.platforms.supersalud.password}
                                label="Contraseña de Supersalud"
                                showValue={false}
                              />
                            </Box>
                          )}

                          {selectedCompany.platforms.supersalud.link && (
                            <Box sx={{ mt: 2 }}>
                              <LinkButton 
                                url={selectedCompany.platforms.supersalud.link}
                                platformName="Supersalud"
                                color="error"
                              />
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialogs}>
                Cerrar
              </Button>
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  handleEditCompany(selectedCompany);
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CompaniesPage;
