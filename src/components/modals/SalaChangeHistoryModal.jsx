import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Pagination,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  AccountCircle as AccountCircleIcon,
  SwapHoriz as SwapIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  LocationOn as LocationOnIcon,
  Title as TitleIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Apartment as ApartmentIcon,
  Wifi as WifiIcon,
  PersonOutline as PersonOutlineIcon,
  Description as DescriptionIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  DeleteOutline as DeleteOutlineIcon,
  TrendingFlat as TrendingFlatIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modal para mostrar el historial de cambios de una sala
 * Registra cambios en: propietario, representante legal, contacto principal
 */
const SalaChangeHistoryModal = ({ open, onClose, salaId, salaName }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [allChanges, setAllChanges] = useState([]); // Todos los cambios sin filtrar
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalChanges, setTotalChanges] = useState(0);
  const changesPerPage = 5;
  
  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    changeType: '',
    changedBy: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    if (open && salaId) {
      setPage(1); // Reset página al abrir
      loadChangeHistory();
    }
  }, [open, salaId]);

  useEffect(() => {
    if (open && salaId) {
      loadChangeHistory();
    }
  }, [open, salaId]);

  // Aplicar paginación cuando cambie la página
  useEffect(() => {
    if (allChanges.length > 0) {
      applyFiltersAndPagination();
    }
  }, [page]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (allChanges.length > 0) {
      setPage(1); // Reset a primera página cuando se filtren
      applyFiltersAndPagination();
    }
  }, [filters]);

  const loadChangeHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los cambios
      const changesQuery = query(
        collection(db, 'sala_changes'),
        where('salaId', '==', salaId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(changesQuery);
      const fetchedChanges = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const changeData = docSnapshot.data();
          let enrichedChangedBy = changeData.changedBy;

          // Enriquecer datos del usuario si existe el UID
          if (changeData.changedBy?.uid) {
            try {
              const userDocRef = doc(db, 'users', changeData.changedBy.uid);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                enrichedChangedBy = {
                  ...changeData.changedBy,
                  // Prioridad: name > displayName > email
                  name: userData.name || userData.displayName || changeData.changedBy.email,
                  email: changeData.changedBy.email
                };
              }
            } catch (error) {
              console.warn('Error enriqueciendo datos de usuario:', error);
              // Si falla, usar datos existentes
            }
          }

          return {
            id: docSnapshot.id,
            ...changeData,
            changedBy: enrichedChangedBy,
            timestamp: changeData.timestamp?.toDate() || new Date()
          };
        })
      );

      setAllChanges(fetchedChanges);
      applyFiltersAndPagination(fetchedChanges);
    } catch (error) {
      console.error('Error cargando historial de cambios:', error);
      
      // Mensaje específico para error de índice
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        setError('El índice de Firebase se está creando. Por favor, espera unos minutos y vuelve a intentar.');
      } else {
        setError('Error al cargar el historial de cambios');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = (dataToFilter = allChanges) => {
    let filtered = [...dataToFilter];

    // Filtrar por tipo de cambio
    if (filters.changeType) {
      filtered = filtered.filter(change => change.changeType === filters.changeType);
    }

    // Filtrar por usuario que hizo el cambio
    if (filters.changedBy) {
      filtered = filtered.filter(change => 
        change.changedBy?.toLowerCase().includes(filters.changedBy.toLowerCase()) ||
        change.changedByEmail?.toLowerCase().includes(filters.changedBy.toLowerCase())
      );
    }

    // Filtrar por rango de fechas
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(change => change.timestamp >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(change => change.timestamp <= toDate);
    }

    // Actualizar total después de filtros
    setTotalChanges(filtered.length);

    // Aplicar paginación
    const startIndex = (page - 1) * changesPerPage;
    const endIndex = startIndex + changesPerPage;
    const paginatedChanges = filtered.slice(startIndex, endIndex);

    setChanges(paginatedChanges);
  };

  const totalPages = Math.ceil(totalChanges / changesPerPage);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      changeType: '',
      changedBy: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'estado':
        return <ToggleOnIcon />;
      case 'empresa':
        return <ApartmentIcon />;
      case 'proveedor_online':
        return <WifiIcon />;
      case 'propietario':
        return <BusinessIcon />;
      case 'representante_legal':
      case 'representante_legal_principal':
        return <BadgeIcon />;
      case 'representante_legal_suplente':
        return <PersonOutlineIcon />;
      case 'contacto_principal':
        return <PersonIcon />;
      case 'contacto_secundario':
        return <PersonOutlineIcon />;
      case 'nombre_sala':
        return <TitleIcon />;
      case 'direccion':
        return <LocationOnIcon />;
      case 'documento_camara_comercio':
      case 'documento_uso_suelos':
      case 'documento_validacion_uso_suelos':
        return <DescriptionIcon />;
      default:
        return <EditIcon />;
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'estado':
        return 'error';
      case 'empresa':
        return 'success';
      case 'proveedor_online':
        return 'info';
      case 'propietario':
        return 'primary';
      case 'representante_legal':
      case 'representante_legal_principal':
        return 'secondary';
      case 'representante_legal_suplente':
        return 'secondary';
      case 'contacto_principal':
        return 'warning';
      case 'contacto_secundario':
        return 'info';
      case 'nombre_sala':
        return 'primary';
      case 'direccion':
        return 'info';
      case 'documento_camara_comercio':
        return 'success';
      case 'documento_uso_suelos':
        return 'success';
      case 'documento_validacion_uso_suelos':
        return 'success';
      default:
        return 'default';
    }
  };

  const getChangeTitle = (changeType) => {
    const titles = {
      estado: 'Cambio de Estado',
      empresa: 'Cambio de Empresa',
      proveedor_online: 'Cambio de Proveedor Online',
      propietario: 'Cambio de Propietario',
      representante_legal: 'Cambio de Representante Legal',
      representante_legal_principal: 'Cambio de Representante Legal Principal',
      representante_legal_suplente: 'Cambio de Representante Legal Suplente',
      contacto_principal: 'Cambio de Contacto Principal',
      contacto_secundario: 'Cambio de Contacto Secundario',
      nombre_sala: 'Cambio de Nombre de Sala',
      direccion: 'Cambio de Dirección',
      documento_camara_comercio: 'Cámara de Comercio',
      documento_uso_suelos: 'Uso de Suelos',
      documento_validacion_uso_suelos: 'Validación Uso de Suelos'
    };
    return titles[changeType] || 'Cambio';
  };

  const renderChangeDetails = (change) => {
    const { changeType, oldValue, newValue, field } = change;

    // Cambios simples de valor (estado, empresa, proveedor, propietario)
    if (['estado', 'empresa', 'proveedor_online', 'propietario'].includes(changeType)) {
      const getStatusLabel = (status) => {
        if (changeType === 'estado') {
          return status === 'active' ? 'Activa' : 'Retirada';
        }
        return status || 'No especificado';
      };

      return (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Anterior:
            </Typography>
            <Chip 
              label={getStatusLabel(oldValue)} 
              size="small" 
              variant="outlined"
              sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Nuevo:
            </Typography>
            <Chip 
              label={getStatusLabel(newValue)} 
              size="small" 
              color="success"
              sx={{ bgcolor: alpha(theme.palette.success.main, 0.15) }}
            />
          </Box>
          {changeType === 'estado' && change.extraData?.fechaRetiro && (
            <Box sx={{ mt: 1.5, p: 1, bgcolor: alpha(theme.palette.warning.main, 0.08), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                📅 Fecha de Retiro:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                {new Date(change.extraData.fechaRetiro).toLocaleDateString('es-CO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    if (changeType === 'representante_legal' || changeType === 'representante_legal_principal') {
      const getTipoDocLabel = (tipo) => {
        const labels = {
          CC: 'Cédula de Ciudadanía',
          NIT: 'NIT',
          CE: 'Cédula de Extranjería',
          PP: 'Pasaporte'
        };
        return labels[tipo] || tipo;
      };

      return (
        <Box>
          {change.changes?.nombreRepLegal && (
            <Box sx={{ mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Nombre:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.nombreRepLegal.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.nombreRepLegal.new}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.tipoDocumentoRepLegal && (
            <Box sx={{ mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Tipo de Documento:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {getTipoDocLabel(change.changes.tipoDocumentoRepLegal.old) || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {getTipoDocLabel(change.changes.tipoDocumentoRepLegal.new)}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.cedulaRepLegal && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Número de Documento:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.cedulaRepLegal.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.cedulaRepLegal.new}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (changeType === 'representante_legal_suplente') {
      const getTipoDocLabel = (tipo) => {
        const labels = {
          CC: 'Cédula de Ciudadanía',
          NIT: 'NIT',
          CE: 'Cédula de Extranjería',
          PP: 'Pasaporte'
        };
        return labels[tipo] || tipo;
      };

      return (
        <Box>
          {change.changes?.nombreRepLegalSuplente && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Nombre:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.nombreRepLegalSuplente.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.nombreRepLegalSuplente.new}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.tipoDocumentoRepLegalSuplente && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Tipo de Documento:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {getTipoDocLabel(change.changes.tipoDocumentoRepLegalSuplente.old) || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {getTipoDocLabel(change.changes.tipoDocumentoRepLegalSuplente.new)}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.cedulaRepLegalSuplente && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Número de Documento:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.cedulaRepLegalSuplente.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.cedulaRepLegalSuplente.new}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (changeType === 'contacto_principal' || changeType === 'contacto_secundario') {
      return (
        <Box>
          {change.changes?.nombre && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Nombre:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.nombre.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.nombre.new}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.telefono && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <PhoneIcon sx={{ fontSize: 12, mr: 0.5 }} />
                Teléfono:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.telefono.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.telefono.new}
                </Typography>
              </Box>
            </Box>
          )}
          {change.changes?.email && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                <EmailIcon sx={{ fontSize: 12, mr: 0.5 }} />
                Email:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {change.changes.email.old || 'No especificado'}
                </Typography>
                <TrendingFlatIcon fontSize="small" sx={{ color: alpha(theme.palette.primary.main, 0.6) }} />
                <Typography variant="body2" fontWeight={600}>
                  {change.changes.email.new}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      );
    }
    
    // Cambios de nombre y dirección
    if (['nombre_sala', 'direccion'].includes(changeType)) {
      return (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Anterior:
            </Typography>
            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              {oldValue || 'No especificado'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Nuevo:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {newValue}
            </Typography>
          </Box>
        </Box>
      );
    }
    
    // Cambios de documentos
    if (['documento_camara_comercio', 'documento_uso_suelos', 'documento_validacion_uso_suelos'].includes(changeType)) {
      const actionColors = {
        carga: 'success',
        eliminación: 'error',
        reemplazo: 'warning'
      };
      
      const actionIcons = {
        carga: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
        eliminación: <DeleteOutlineIcon sx={{ fontSize: 18 }} />,
        reemplazo: <TrendingFlatIcon sx={{ fontSize: 18 }} />
      };
      
      const actionLabels = {
        carga: 'Documento Cargado',
        eliminación: 'Documento Eliminado',
        reemplazo: 'Documento Reemplazado'
      };
      
      return (
        <Box>
          <Box 
            sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1.25,
              px: 1.5,
              py: 0.5,
              bgcolor: alpha(theme.palette[actionColors[change.action]].main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette[actionColors[change.action]].main, 0.3)}`
            }}
          >
            <Box sx={{ 
              color: theme.palette[actionColors[change.action]].main,
              display: 'flex',
              alignItems: 'center'
            }}>
              {actionIcons[change.action]}
            </Box>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ color: theme.palette[actionColors[change.action]].main }}
            >
              {actionLabels[change.action]}
            </Typography>
          </Box>
          {change.action === 'reemplazo' && (
            <Box>
              {oldValue && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Archivo anterior:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {oldValue}
                  </Typography>
                </Box>
              )}
              {newValue && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Archivo nuevo:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                    {newValue}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          {change.action === 'carga' && newValue && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Archivo:
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                {newValue}
              </Typography>
            </Box>
          )}
          {change.action === 'eliminación' && oldValue && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Archivo eliminado:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                {oldValue}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return null;
  };

  return (
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
      <DialogTitle
        sx={{
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 40,
              height: 40
            }}
          >
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              Historial de Cambios
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {salaName}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {/* Barra de Filtros */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant={hasActiveFilters() ? "contained" : "outlined"}
              size="small"
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                py: 1
              }}
            >
              Filtros {hasActiveFilters() && `(${Object.values(filters).filter(v => v).length})`}
            </Button>
            
            {hasActiveFilters() && (
              <Button
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="small"
                color="error"
                variant="outlined"
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 2 }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>

          <Collapse in={showFilters}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                background: alpha(theme.palette.primary.main, 0.04),
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {/* Filtro por Tipo de Cambio */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Tipo de Cambio</InputLabel>
                    <Select
                      value={filters.changeType}
                      onChange={(e) => handleFilterChange('changeType', e.target.value)}
                      label="Tipo de Cambio"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="estado">Estado</MenuItem>
                      <MenuItem value="empresa">Empresa</MenuItem>
                      <MenuItem value="proveedor_online">Proveedor Online</MenuItem>
                      <MenuItem value="propietario">Propietario</MenuItem>
                      <MenuItem value="representante_legal">Representante Legal</MenuItem>
                      <MenuItem value="contacto_principal">Contacto Principal</MenuItem>
                      <MenuItem value="contacto_secundario">Contacto Secundario</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Filtro por Usuario */}
                  <TextField
                    size="small"
                    label="Usuario que hizo el cambio"
                    value={filters.changedBy}
                    onChange={(e) => handleFilterChange('changedBy', e.target.value)}
                    placeholder="Nombre o email..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {/* Filtro Fecha Desde */}
                  <TextField
                    size="small"
                    label="Desde"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />

                  {/* Filtro Fecha Hasta */}
                  <TextField
                    size="small"
                    label="Hasta"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Collapse>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : changes.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={300}>
            {hasActiveFilters() ? (
              <>
                <FilterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron resultados
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  No hay cambios que coincidan con los filtros aplicados
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                >
                  Limpiar Filtros
                </Button>
              </>
            ) : (
              <>
                <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No hay cambios registrados
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Aún no se han realizado cambios en esta sala
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {changes.map((change, index) => (
              <Grid item xs={12} md={6} key={change.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    border: `1px solid ${alpha(theme.palette[getChangeColor(change.changeType)].main, 0.2)}`,
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '100%',
                    '&:hover': {
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      borderColor: alpha(theme.palette[getChangeColor(change.changeType)].main, 0.4),
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Header con fecha y usuario */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          background: `linear-gradient(135deg, ${theme.palette[getChangeColor(change.changeType)].main} 0%, ${theme.palette[getChangeColor(change.changeType)].dark} 100%)`,
                          width: 36,
                          height: 36,
                          boxShadow: `0 4px 12px ${alpha(theme.palette[getChangeColor(change.changeType)].main, 0.3)}`,
                          transition: 'transform 0.2s ease',
                          '& svg': {
                            fontSize: 20
                          }
                        }}
                      >
                        {getChangeIcon(change.changeType)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                          {getChangeTitle(change.changeType)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(change.timestamp, "d 'de' MMMM 'de' yyyy • HH:mm", { locale: es })}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={change.changedBy?.name || 'Usuario'}
                      size="small"
                      avatar={
                        <Avatar 
                          sx={{ 
                            bgcolor: 'transparent',
                            color: theme.palette[getChangeColor(change.changeType)].main,
                            fontSize: 16,
                            fontWeight: 700
                          }}
                        >
                          {(change.changedBy?.name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      sx={{ 
                        bgcolor: alpha(theme.palette[getChangeColor(change.changeType)].main, 0.1),
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 0.5,
                        border: `1px solid ${alpha(theme.palette[getChangeColor(change.changeType)].main, 0.2)}`,
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Detalles del cambio */}
                  {renderChangeDetails(change)}
                  
                  {/* Motivo (si existe) */}
                  {change.reason && (
                    <Box sx={{ 
                      mt: 1.5, 
                      p: 1.25, 
                      bgcolor: alpha(theme.palette.info.main, 0.05), 
                      borderRadius: 1,
                      borderLeft: `3px solid ${theme.palette.info.main}`
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        💬 Motivo del cambio:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {change.reason}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Controles de Paginación */}
        {!loading && !error && totalChanges > changesPerPage && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Mostrando {changes.length > 0 ? ((page - 1) * changesPerPage) + 1 : 0} - {Math.min(page * changesPerPage, totalChanges)} de {totalChanges} cambios
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="medium"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1,
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  },
                  '& .Mui-selected': {
                    fontWeight: 600
                  }
                }}
              />
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            borderRadius: 1, 
            textTransform: 'none', 
            fontWeight: 600,
            px: 3,
            py: 1
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalaChangeHistoryModal;
