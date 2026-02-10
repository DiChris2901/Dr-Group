import React, { useState } from 'react';
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
  Info as InfoIcon
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
import { db } from '../../config/firebase';
import { differenceInDays } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';

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
  const [openCertificadoModal, setOpenCertificadoModal] = useState(false); // Modal para generar certificado
  const [openPreviewCertificado, setOpenPreviewCertificado] = useState(false); // Modal preview del certificado generado
  const [certificadoData, setCertificadoData] = useState({
    empleadoNombre: '',
    empleadoDocumento: '',
    empleadoCargo: '',
    empleadoSalario: '',
    fechaIngreso: '',
    dirigidoA: '',
    incluyeSalario: false,
    empresaNombre: '',
    empresaNIT: '',
    empresaLogo: '',
    empresaDireccion: '',
    empresaCiudad: ''
  });
  const [filterSolicitudTipo, setFilterSolicitudTipo] = useState('todos');
  const [filterSolicitudEstado, setFilterSolicitudEstado] = useState('todos');
  const [searchSolicitud, setSearchSolicitud] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form Solicitud
  const [formSolicitud, setFormSolicitud] = useState({
    tipo: 'vacaciones',
    empleadoId: '',
    empleadoNombre: '',
    fechaInicio: '',
    fechaFin: '',
    dias: 0,
    motivo: '',
    // Campos específicos para certificaciones
    dirigidoA: '',
    incluirSalario: false,
    fechaRequerida: ''
  });

  // Calcular días automáticamente
  React.useEffect(() => {
    if (formSolicitud.fechaInicio && formSolicitud.fechaFin) {
      const inicio = new Date(formSolicitud.fechaInicio);
      const fin = new Date(formSolicitud.fechaFin);
      const dias = differenceInDays(fin, inicio) + 1;
      setFormSolicitud(prev => ({ ...prev, dias: dias > 0 ? dias : 0 }));
    }
  }, [formSolicitud.fechaInicio, formSolicitud.fechaFin]);

  // Crear o actualizar solicitud
  const handleCrearSolicitud = async () => {
    try {
      // Validación base
      if (!formSolicitud.empleadoId) {
        showToast('Por favor selecciona un empleado', 'warning');
        return;
      }

      // Validación de fechas solo para solicitudes que no sean certificaciones
      if (formSolicitud.tipo !== 'certificacion') {
        if (!formSolicitud.fechaInicio || !formSolicitud.fechaFin) {
          showToast('Por favor completa las fechas de inicio y fin', 'warning');
          return;
        }
      }

      // Validación de motivo obligatorio para certificaciones
      if (formSolicitud.tipo === 'certificacion') {
        if (!formSolicitud.motivo || !formSolicitud.dirigidoA) {
          showToast('Por favor completa el tipo de certificación y a quién va dirigida', 'warning');
          return;
        }
      }

      const empleado = empleados.find(e => e.id === formSolicitud.empleadoId);
      
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

      // Agregar fechas solo si no es certificación
      if (formSolicitud.tipo !== 'certificacion') {
        solicitudData.fechaInicio = Timestamp.fromDate(new Date(formSolicitud.fechaInicio));
        solicitudData.fechaFin = Timestamp.fromDate(new Date(formSolicitud.fechaFin));
        solicitudData.dias = formSolicitud.dias;
      } else {
        // Agregar campos específicos de certificación
        solicitudData.dirigidoA = formSolicitud.dirigidoA;
        solicitudData.incluirSalario = formSolicitud.incluirSalario;
        if (formSolicitud.fechaRequerida) {
          solicitudData.fechaRequerida = Timestamp.fromDate(new Date(formSolicitud.fechaRequerida));
        }
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

  // Enviar certificado (Admin RRHH) - Abre modal para generar certificado
  const handleEnviarCertificado = async (solicitud) => {
    setSelectedSolicitudId(solicitud.id);
    
    try {
      // ESTRATEGIA 1: Buscar por apellido (extraído del nombre completo)
      // Ejemplo: "David López" → buscar empleado con apellido que contenga "López"
      const nombreCompleto = solicitud.empleadoNombre || '';
      const palabras = nombreCompleto.trim().split(' ');
      const apellido = palabras[palabras.length - 1]; // Última palabra = apellido
      
      console.log(`Buscando empleado por apellido: "${apellido}"`);
      
      let empleadoData = null;
      
      // Buscar en la colección empleados por apellido
      const q = query(
        collection(db, 'empleados'),
        where('apellidos', '>=', apellido),
        where('apellidos', '<=', apellido + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        empleadoData = querySnapshot.docs[0].data();
        console.log('✅ Empleado encontrado por apellido');
      } else {
        // ESTRATEGIA 2: Buscar por createdBy (UID del usuario)
        console.log('Buscando por createdBy:', solicitud.empleadoId);
        const q2 = query(
          collection(db, 'empleados'),
          where('createdBy', '==', solicitud.empleadoId)
        );
        const querySnapshot2 = await getDocs(q2);
        
        if (!querySnapshot2.empty) {
          empleadoData = querySnapshot2.docs[0].data();
          console.log('✅ Empleado encontrado por createdBy');
        }
      }
      
      if (empleadoData) {
        // Concatenar nombres y apellidos completos de Firestore
        const nombreCompletoFirestore = `${empleadoData.nombres || ''} ${empleadoData.apellidos || ''}`.trim();
        
        // Obtener cargo: primero de empleados, luego de users
        let cargo = empleadoData.cargo || empleadoData.position || '';
        
        // Si no hay cargo en empleados, buscar en users
        if (!cargo && solicitud.empleadoId) {
          try {
            const userRef = doc(db, 'users', solicitud.empleadoId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              cargo = userData.position || '';
              console.log('Cargo obtenido de users:', cargo);
            }
          } catch (error) {
            console.error('Error al obtener cargo de users:', error);
          }
        }
        
        // Formatear fecha de ingreso si existe
        let fechaIngresoFormatted = '';
        if (empleadoData.fechaInicioContrato) {
          if (empleadoData.fechaInicioContrato.toDate) {
            // Es un Timestamp de Firestore
            const fecha = empleadoData.fechaInicioContrato.toDate();
            fechaIngresoFormatted = fecha.toISOString().split('T')[0];
          } else if (typeof empleadoData.fechaInicioContrato === 'string') {
            // Ya es string formato "2023-07-01"
            fechaIngresoFormatted = empleadoData.fechaInicioContrato;
          }
        }

        // Obtener datos de la empresa contratante
        let empresaDatos = { nombre: '', nit: '', logo: '', direccion: '', ciudad: '' };
        
        console.log('📋 Datos empleado completos:', empleadoData);
        console.log('🏢 empresaContratante ID:', empleadoData.empresaContratante);
        
        if (empleadoData.empresaContratante) {
          try {
            // Buscar empresa por nombre (ya que empresaContratante guarda el nombre, no el ID)
            const empresaQuery = query(
              collection(db, 'companies'),
              where('name', '==', empleadoData.empresaContratante)
            );
            const empresaSnapshot = await getDocs(empresaQuery);
            
            if (!empresaSnapshot.empty) {
              const empresaData = empresaSnapshot.docs[0].data();
              console.log('🏢 Datos empresa desde Firestore:', empresaData);
              
              empresaDatos = {
                nombre: empresaData.name || empresaData.nombre || '',
                nit: empresaData.nit || empresaData.NIT || '',
                logo: empresaData.logoURL || empresaData.logo || '',
                direccion: empresaData.address || empresaData.direccion || '',
                ciudad: empresaData.city || empresaData.ciudad || ''
              };
              console.log('✅ Datos empresa procesados:', empresaDatos);
            } else {
              console.warn('⚠️ Empresa no encontrada en companies:', empleadoData.empresaContratante);
            }
          } catch (error) {
            console.error('❌ Error al obtener datos de empresa:', error);
          }
        } else {
          console.warn('⚠️ empleadoData.empresaContratante está vacío o no existe');
        }
        
        // Pre-llenar formulario con datos de Firestore
        setCertificadoData({
          empleadoNombre: nombreCompletoFirestore || solicitud.empleadoNombre || '',
          empleadoDocumento: empleadoData.numeroDocumento || '',
          empleadoCargo: cargo,
          empleadoSalario: empleadoData.salario || '',
          fechaIngreso: fechaIngresoFormatted,
          dirigidoA: solicitud.dirigidoA || '',
          incluyeSalario: solicitud.incluirSalario || false,
          empresaNombre: empresaDatos.nombre,
          empresaNIT: empresaDatos.nit,
          empresaLogo: empresaDatos.logo,
          empresaDireccion: empresaDatos.direccion,
          empresaCiudad: empresaDatos.ciudad
        });
        
        console.log('✅ Datos cargados correctamente:', {
          nombre: nombreCompletoFirestore,
          documento: empleadoData.numeroDocumento,
          cargo: cargo,
          fechaIngreso: fechaIngresoFormatted
        });
      } else {
        // Si no existe el empleado en Firestore, usar datos de la solicitud
        setCertificadoData({
          empleadoNombre: solicitud.empleadoNombre || '',
          empleadoDocumento: '',
          empleadoCargo: '',
          empleadoSalario: '',
          fechaIngreso: '',
          dirigidoA: solicitud.dirigidoA || '',
          incluyeSalario: solicitud.incluirSalario || false,
          empresaNombre: '',
          empresaNIT: '',
          empresaLogo: '',
          empresaDireccion: '',
          empresaCiudad: ''
        });
        showToast('Empleado no encontrado en la base de datos. Completa manualmente.', 'warning');
      }
    } catch (error) {
      console.error('Error al consultar empleado:', error);
      // En caso de error, usar datos básicos de la solicitud
      setCertificadoData({
        empleadoNombre: solicitud.empleadoNombre || '',
        empleadoDocumento: '',
        empleadoCargo: '',
        empleadoSalario: '',
        fechaIngreso: '',
        dirigidoA: solicitud.dirigidoA || '',
        incluyeSalario: solicitud.incluirSalario || false
      });
      showToast('Error al consultar datos del empleado', 'error');
    }
    
    setOpenCertificadoModal(true);
  };

  // Generar certificado (solo preview, no envía)
  const handleGenerarCertificado = () => {
    // Validaciones
    if (!certificadoData.empleadoNombre || !certificadoData.empleadoDocumento || !certificadoData.empleadoCargo) {
      showToast('Completa todos los campos obligatorios', 'warning');
      return;
    }

    // Cerrar modal de formulario y abrir preview
    setOpenCertificadoModal(false);
    setOpenPreviewCertificado(true);
    showToast('Certificado generado. Revisa y envía.', 'info');
  };

  // Enviar certificado (después de revisar el preview)
  const handleEnviarCertificadoFinal = async () => {
    try {
      // Aquí iría la lógica de generación del PDF
      // Por ahora, solo actualizamos el estado
      const solicitudRef = doc(db, 'solicitudes', selectedSolicitudId);
      await updateDoc(solicitudRef, {
        estado: 'enviado',
        fechaEnvio: new Date(),
        certificadoData: certificadoData,
        // certificadoURL: 'URL_DEL_PDF' // Se agregará cuando implementemos generación PDF
      });
      
      showToast('Certificado enviado exitosamente', 'success');
      setOpenPreviewCertificado(false);
      setCertificadoData({
        empleadoNombre: '',
        empleadoDocumento: '',
        empleadoCargo: '',
        empleadoSalario: '',
        fechaIngreso: '',
        dirigidoA: '',
        incluyeSalario: false
      });
    } catch (error) {
      console.error('Error al enviar certificado:', error);
      showToast('Error al enviar el certificado', 'error');
    }
  };

  // Ver certificado (Usuario) - Si está "enviado", cambia automáticamente a "recibido"
  const handleVerCertificado = async (solicitudId, estadoActual) => {
    try {
      if (estadoActual === 'enviado') {
        const solicitudRef = doc(db, 'solicitudes', solicitudId);
        await updateDoc(solicitudRef, {
          estado: 'recibido',
          fechaRecepcion: new Date()
        });
        showToast('Certificado marcado como recibido', 'success');
      }
      // Aquí iría la lógica de visualización del certificado (modal, PDF, etc.)
      // Por ahora solo cambiamos el estado
    } catch (error) {
      console.error('Error al marcar como recibido:', error);
      showToast('Error al abrir el certificado', 'error');
    }
  };

  // Eliminar solicitud
  const handleEliminarSolicitud = async (solicitudId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    
    try {
      await deleteDoc(doc(db, 'solicitudes', solicitudId));
      showToast('Solicitud eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      showToast('Error al eliminar la solicitud', 'error');
    }
  };

  // Abrir modal
  const handleNuevaSolicitud = () => {
    // Si NO es admin de RRHH, auto-seleccionar el usuario actual
    const initialForm = {
      tipo: 'vacaciones',
      empleadoId: canManageSolicitudes ? '' : (userProfile?.uid || ''),
      empleadoNombre: canManageSolicitudes ? '' : (userProfile?.name || userProfile?.displayName || userProfile?.email || ''),
      fechaInicio: '',
      fechaFin: '',
      dias: 0,
      motivo: '',
      dirigidoA: '',
      incluirSalario: false,
      fechaRequerida: ''
    };
    setFormSolicitud(initialForm);
    setOpenSolicitudModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenSolicitudModal(false);
    setEditingSolicitudId(null);
    // Resetear formulario
    setFormSolicitud({
      tipo: 'vacaciones',
      empleadoId: '',
      empleadoNombre: '',
      fechaInicio: '',
      fechaFin: '',
      dias: 0,
      motivo: '',
      dirigidoA: '',
      incluirSalario: false,
      fechaRequerida: ''
    });
  };

  // Editar solicitud existente
  const handleEditarSolicitud = (solicitud) => {
    setEditingSolicitudId(solicitud.id);
    
    // Convertir fechas a formato YYYY-MM-DD para inputs date
    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().split('T')[0];
    };

    setFormSolicitud({
      tipo: solicitud.tipo || 'vacaciones',
      empleadoId: solicitud.empleadoId || '',
      empleadoNombre: solicitud.empleadoNombre || '',
      fechaInicio: formatDateForInput(solicitud.fechaInicio),
      fechaFin: formatDateForInput(solicitud.fechaFin),
      dias: solicitud.dias || 0,
      motivo: solicitud.motivo || '',
      dirigidoA: solicitud.dirigidoA || '',
      incluirSalario: solicitud.incluirSalario || false,
      fechaRequerida: formatDateForInput(solicitud.fechaRequerida),
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
      default: 
        return <AssignmentIcon sx={iconStyles} />;
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
                        <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {solicitud.tipo}
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
                          {format(solicitud.fechaSolicitud, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>
                    ) : (
                      // VACACIONES/PERMISOS: Mostrar fechas y días
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Fecha Inicio
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {solicitud.fechaInicio && format(solicitud.fechaInicio, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Fecha Fin
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {solicitud.fechaFin && format(solicitud.fechaFin, 'dd MMM yyyy', { locale: es })}
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
                        {solicitud.tipo === 'certificacion' ? (
                          // CERTIFICACIONES: Flujo diferente (Pendiente → Enviado → Recibido)
                          <>
                            {canManageSolicitudes ? (
                              // Admin RRHH para certificaciones
                              <>
                                {solicitud.estado === 'pendiente' && (
                                  <Tooltip title="Enviar Certificado">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.primary.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                      }}
                                      onClick={() => handleEnviarCertificado(solicitud)}
                                    >
                                      <CheckIcon fontSize="small" />
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
                                {(solicitud.estado === 'enviado' || solicitud.estado === 'recibido') && (
                                  <Tooltip title="Ver Certificado">
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.info.main,
                                        '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) }
                                      }}
                                      onClick={() => handleVerCertificado(solicitud.id, solicitud.estado)}
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
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
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
            {formSolicitud.tipo !== 'certificacion' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Inicio"
                    value={formSolicitud.fechaInicio}
                    onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaInicio: e.target.value })}
                    InputLabelProps={{ shrink: true }}
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
                  />
                </Grid>

                {/* Días Calculados */}
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
                      <strong>Días solicitados:</strong> {formSolicitud.dias} día{formSolicitud.dias !== 1 ? 's' : ''}
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

            {/* Motivo */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                required={formSolicitud.tipo === 'certificacion'}
                label={formSolicitud.tipo === 'certificacion' ? 'Tipo de certificación' : 'Motivo (opcional)'}
                value={formSolicitud.motivo || ''}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
                placeholder={
                  formSolicitud.tipo === 'certificacion' 
                    ? 'Ej: Certificación laboral, certificación de ingresos, constancia de trabajo...'
                    : 'Describe el motivo de la solicitud...'
                }
                helperText={formSolicitud.tipo === 'certificacion' ? 'Especifica qué tipo de certificación necesitas' : ''}
              />
            </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
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
              px: 4,
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
                  ? alpha(theme.palette.primary.main, 0.1) 
                  : alpha(theme.palette.error.main, 0.1),
                color: confirmAction === 'aprobar' 
                  ? theme.palette.primary.main 
                  : theme.palette.error.main
              }}
            >
              {confirmAction === 'aprobar' ? <CheckIcon /> : <CloseIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
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
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
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
              px: 4,
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

      {/* MODAL: GENERAR CERTIFICADO */}
      <Dialog
        open={openCertificadoModal}
        onClose={() => setOpenCertificadoModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <DocumentoIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Generar Certificación Laboral
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Completa los datos para generar el certificado
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Grid container spacing={3}>
            {/* Nombre Completo */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Nombre Completo del Empleado"
                value={certificadoData.empleadoNombre}
                onChange={(e) => setCertificadoData({ ...certificadoData, empleadoNombre: e.target.value })}
                placeholder="Ej: Juan Pérez García"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>

            {/* Documento */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Cédula / Documento"
                value={certificadoData.empleadoDocumento}
                onChange={(e) => setCertificadoData({ ...certificadoData, empleadoDocumento: e.target.value })}
                placeholder="Ej: 1234567890"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>

            {/* Cargo */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Cargo"
                value={certificadoData.empleadoCargo}
                onChange={(e) => setCertificadoData({ ...certificadoData, empleadoCargo: e.target.value })}
                placeholder="Ej: Analista de Sistemas"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>

            {/* Fecha de Ingreso */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha de Ingreso"
                value={certificadoData.fechaIngreso}
                onChange={(e) => setCertificadoData({ ...certificadoData, fechaIngreso: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>

            {/* Dirigido A */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirigido A"
                value={certificadoData.dirigidoA}
                onChange={(e) => setCertificadoData({ ...certificadoData, dirigidoA: e.target.value })}
                placeholder="Ej: A quien pueda interesar, Banco XYZ, etc."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>

            {/* Incluir Salario */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={certificadoData.incluyeSalario}
                    onChange={(e) => setCertificadoData({ ...certificadoData, incluyeSalario: e.target.checked })}
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                label="Incluir información salarial en el certificado"
              />
            </Grid>

            {/* Salario (solo si checkbox está activo) */}
            {certificadoData.incluyeSalario && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Salario Mensual"
                  value={certificadoData.empleadoSalario}
                  onChange={(e) => {
                    // Remover caracteres no numéricos
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    
                    // Formatear a pesos colombianos
                    const formatted = rawValue ? new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(parseInt(rawValue)) : '';
                    
                    setCertificadoData({ ...certificadoData, empleadoSalario: formatted });
                  }}
                  placeholder="Ej: $2,500,000"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button
            onClick={() => setOpenCertificadoModal(false)}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: 1, fontWeight: 500, textTransform: 'none', px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerarCertificado}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              bgcolor: theme.palette.primary.main,
              color: '#fff',
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Generar Certificado
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: PREVIEW CERTIFICADO */}
      <Dialog
        open={openPreviewCertificado}
        onClose={() => setOpenPreviewCertificado(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
              <CheckIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Certificación Laboral Generada
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Revisa la información antes de enviar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.5)
            }}
          >
            {/* Encabezado con logo y datos de la empresa */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {certificadoData.empresaLogo && (
                <Avatar
                  src={certificadoData.empresaLogo}
                  alt={certificadoData.empresaNombre}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                  variant="rounded"
                />
              )}
              
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {certificadoData.empresaNombre || 'DR Group'}
              </Typography>
              
              {certificadoData.empresaNIT && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  NIT: {certificadoData.empresaNIT}
                </Typography>
              )}
              
              {certificadoData.empresaDireccion && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {certificadoData.empresaDireccion}
                  {certificadoData.empresaCiudad && ` - ${certificadoData.empresaCiudad}`}
                </Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
                CERTIFICACIÓN LABORAL
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {certificadoData.dirigidoA || 'A quien pueda interesar'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Contenido */}
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, textAlign: 'justify' }}>
              La empresa <strong>{certificadoData.empresaNombre || 'DR Group'}</strong> certifica que:
            </Typography>

            <Box sx={{ pl: 2, mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>{certificadoData.empleadoNombre}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Documento de identidad: {certificadoData.empleadoDocumento}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Cargo: {certificadoData.empleadoCargo}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Fecha de ingreso: {certificadoData.fechaIngreso && new Date(certificadoData.fechaIngreso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
              {certificadoData.incluyeSalario && certificadoData.empleadoSalario && (
                <Typography variant="body2" color="text.secondary">
                  Salario mensual: {certificadoData.empleadoSalario}
                </Typography>
              )}
            </Box>

            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
              Labora actualmente en nuestra organización desempeñando sus funciones de manera satisfactoria.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Se expide la presente certificación a solicitud del interesado.
            </Typography>
          </Paper>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button
            onClick={() => {
              setOpenPreviewCertificado(false);
              setOpenCertificadoModal(true); // Volver a editar
            }}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: 1, fontWeight: 500, textTransform: 'none', px: 3 }}
          >
            Editar
          </Button>
          <Button
            onClick={handleEnviarCertificadoFinal}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              bgcolor: theme.palette.success.main,
              color: '#fff',
              '&:hover': { bgcolor: theme.palette.success.dark }
            }}
          >
            Enviar Certificado
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default SolicitudesRRHH;
