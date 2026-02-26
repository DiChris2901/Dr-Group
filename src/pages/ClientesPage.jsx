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
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  WhatsApp as WhatsAppIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { exportarClientesSpectacular } from '../utils/clientesExcelExportSpectacular';

const ClientesPage = () => {
  const theme = useTheme();
  
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Estados para edición de clientes
  const [editClienteDialogOpen, setEditClienteDialogOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  const [editClienteForm, setEditClienteForm] = useState({ nombre: '', email: '', telefono: '' });
  const [updatingCliente, setUpdatingCliente] = useState(false);
  
  // Estados para edición de administradores
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [editAdminForm, setEditAdminForm] = useState({ nombre: '', email: '', telefono: '' });
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  // Cargar clientes y administradores desde las salas en Firestore
  useEffect(() => {
    const q = query(collection(db, 'salas'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Agrupar salas por cliente (propietarios - contactoAutorizado)
        const clientesMap = new Map();
        // Mapa de administradores únicos
        const administradoresMap = new Map();
        
        snapshot.docs.forEach(doc => {
          const sala = { id: doc.id, ...doc.data() };
          
          // Procesar contacto autorizado 1 (propietario de la sala = cliente real)
          if (sala.contactoAutorizado && sala.contactoAutorizado.trim()) {
            const clienteKey = sala.contactoAutorizado.toLowerCase().trim();
            
            if (!clientesMap.has(clienteKey)) {
              clientesMap.set(clienteKey, {
                nombre: sala.contactoAutorizado,
                email: sala.contactEmail || '',
                telefono: sala.contactPhone || '',
                salas: [],
                administradores: []
              });
            }
            
            clientesMap.get(clienteKey).salas.push({
              id: sala.id,
              nombre: sala.name,
              empresa: sala.companyName,
              ciudad: sala.ciudad,
              status: sala.status
            });
          }
          
          // Procesar contacto autorizado 2 (administradores/encargados)
          if (sala.contactoAutorizado2 && sala.contactoAutorizado2.trim()) {
            const adminKey = sala.contactoAutorizado2.toLowerCase().trim();
            
            if (!administradoresMap.has(adminKey)) {
              administradoresMap.set(adminKey, {
                nombre: sala.contactoAutorizado2,
                email: sala.contactEmail2 || '',
                telefono: sala.contactPhone2 || '',
                salas: []
              });
            }
            
            administradoresMap.get(adminKey).salas.push({
              id: sala.id,
              nombre: sala.name,
              empresa: sala.companyName
            });
          }
        });
        
        // Agregar administradores a cada cliente basado en salas compartidas
        clientesMap.forEach((cliente) => {
          const adminSet = new Set();
          
          // Para cada sala del cliente, buscar administradores que trabajan en esa sala
          cliente.salas.forEach(salaCliente => {
            administradoresMap.forEach((admin) => {
              // Si el administrador trabaja en alguna sala del cliente
              if (admin.salas.some(salaAdmin => salaAdmin.id === salaCliente.id)) {
                const adminKey = admin.nombre.toLowerCase().trim();
                if (!adminSet.has(adminKey)) {
                  adminSet.add(adminKey);
                  cliente.administradores.push({
                    nombre: admin.nombre,
                    email: admin.email,
                    telefono: admin.telefono,
                    salasAsociadas: admin.salas.filter(s => 
                      cliente.salas.some(cs => cs.id === s.id)
                    ).map(s => s.nombre)
                  });
                }
              }
            });
          });
        });
        
        // Convertir Map a Array y ordenar por nombre
        const clientesData = Array.from(clientesMap.values())
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setClientes(clientesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading clientes:', err);
        setError('Error al cargar clientes y administradores desde salas');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Funciones CRUD eliminadas - página solo de visualización
  // Los clientes provienen de la colección 'salas' y no se editan directamente aquí

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.salas?.some(sala => sala.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación
  const paginatedClientes = filteredClientes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Función para exportar clientes
  const handleExportClientes = async () => {
    try {
      if (!clientes || clientes.length === 0) {
        alert('No hay clientes para exportar');
        return;
      }

      const result = await exportarClientesSpectacular(clientes);

      if (result.success) {
        alert(`✅ Exportación exitosa\n\n📊 ${result.recordCount} clientes exportados\n📁 Archivo: ${result.filename}`);
      }
    } catch (error) {
      console.error('❌ Error al exportar clientes:', error);
      alert('❌ Error al exportar clientes. Por favor intente nuevamente.');
    }
  };



  // ============================================
  // EDICIÓN DE CLIENTES
  // ============================================
  
  const handleEditCliente = (cliente) => {
    setClienteToEdit(cliente);
    setEditClienteForm({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || ''
    });
    setEditClienteDialogOpen(true);
  };

  const handleCloseEditClienteDialog = () => {
    setEditClienteDialogOpen(false);
    setClienteToEdit(null);
    setEditClienteForm({ nombre: '', email: '', telefono: '' });
  };

  const handleUpdateCliente = async () => {
    if (!clienteToEdit || !editClienteForm.nombre.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    setUpdatingCliente(true);

    try {
      // 1. Buscar solo las salas donde aparece este cliente (server-side filter)
      const salasSnapshot = await getDocs(
        query(collection(db, 'salas'), where('contactoAutorizado', '==', clienteToEdit.nombre))
      );
      const batch = writeBatch(db);
      let salasActualizadas = 0;

      // 2. Actualizar las salas encontradas
      salasSnapshot.docs.forEach((salaDoc) => {
        batch.update(doc(db, 'salas', salaDoc.id), {
          contactoAutorizado: editClienteForm.nombre.trim(),
          contactEmail: editClienteForm.email.trim(),
          contactPhone: editClienteForm.telefono.trim()
        });
        salasActualizadas++;
      });

      // 3. Ejecutar actualización en batch
      if (salasActualizadas > 0) {
        await batch.commit();
      }

      alert(`✅ Cliente actualizado exitosamente\n\n📊 ${salasActualizadas} sala(s) sincronizada(s)`);
      handleCloseEditClienteDialog();
    } catch (error) {
      console.error('Error updating cliente:', error);
      alert('❌ Error al actualizar cliente. Por favor intente nuevamente.');
    } finally {
      setUpdatingCliente(false);
    }
  };

  // ============================================
  // EDICIÓN DE ADMINISTRADORES
  // ============================================

  const handleEditAdmin = (admin) => {
    setAdminToEdit(admin);
    setEditAdminForm({
      nombre: admin.nombre || '',
      email: admin.email || '',
      telefono: admin.telefono || ''
    });
    setEditAdminDialogOpen(true);
  };

  const handleCloseEditAdminDialog = () => {
    setEditAdminDialogOpen(false);
    setAdminToEdit(null);
    setEditAdminForm({ nombre: '', email: '', telefono: '' });
  };

  const handleUpdateAdmin = async () => {
    if (!adminToEdit || !editAdminForm.nombre.trim()) {
      alert('El nombre del administrador es obligatorio');
      return;
    }

    setUpdatingAdmin(true);

    try {
      // 1. Buscar solo las salas donde aparece este administrador (server-side filter)
      const salasSnapshot = await getDocs(
        query(collection(db, 'salas'), where('contactoAutorizado2', '==', adminToEdit.nombre))
      );
      const batch = writeBatch(db);
      let salasActualizadas = 0;

      // 2. Actualizar las salas encontradas
      salasSnapshot.docs.forEach((salaDoc) => {
        batch.update(doc(db, 'salas', salaDoc.id), {
          contactoAutorizado2: editAdminForm.nombre.trim(),
          contactEmail2: editAdminForm.email.trim(),
          contactPhone2: editAdminForm.telefono.trim()
        });
        salasActualizadas++;
      });

      // 3. Ejecutar actualización en batch
      if (salasActualizadas > 0) {
        await batch.commit();
      }

      alert(`✅ Administrador actualizado exitosamente\n\n📊 ${salasActualizadas} sala(s) sincronizada(s)`);
      handleCloseEditAdminDialog();
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('❌ Error al actualizar administrador. Por favor intente nuevamente.');
    } finally {
      setUpdatingAdmin(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      {/* HEADER */}
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
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              GESTIÓN EMPRESARIAL • CLIENTES
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mt: 0.5, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <PersonIcon sx={{ fontSize: 35 }} />
              Clientes
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
              Gestiona tu base de clientes y mantén su información actualizada
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Actualizar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ESTADÍSTICAS - DISEÑO SOBRIO */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 48,
                  height: 48
                }}>
                  <PersonIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Clientes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    {clientes.length}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Clientes registrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.success.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  width: 48,
                  height: 48
                }}>
                  <EmailIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Con Email
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                    {clientes.filter(c => c.email).length}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {clientes.length > 0 ? Math.round((clientes.filter(c => c.email).length / clientes.length) * 100) : 0}% del total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.info.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  width: 48,
                  height: 48
                }}>
                  <PhoneIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Con Teléfono
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                    {clientes.filter(c => c.telefono).length}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {clientes.length > 0 ? Math.round((clientes.filter(c => c.telefono).length / clientes.length) * 100) : 0}% del total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.warning.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  width: 48,
                  height: 48
                }}>
                  <BusinessIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Salas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                    {clientes.reduce((total, c) => total + (c.salas?.length || 0), 0)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {clientes.length > 0 ? (clientes.reduce((total, c) => total + (c.salas?.length || 0), 0) / clientes.length).toFixed(1) : 0} salas/cliente promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TOOLBAR Y BUSCADOR */}
      <Card sx={{ 
        mb: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' } }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email, teléfono o sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setSearchTerm('')}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2
                }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={handleExportClientes}
                disabled={clientes.length === 0}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground
                  }
                }}
              >
                Exportar
              </Button>
            </Box>
          </Box>
          
          {/* Resultados de búsqueda */}
          {searchTerm && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando <strong>{filteredClientes.length}</strong> de <strong>{clientes.length}</strong> clientes
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* TABLA DE CLIENTES */}
      <Card sx={{
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📋 Listado de Clientes
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gestión completa de propietarios y sus salas asociadas
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Salas Anexas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClientes.map((cliente, index) => {
                  const rowKey = `${cliente.nombre}-${index}`;
                  const isExpanded = expandedRows.has(rowKey);
                  const hasAdministradores = cliente.administradores && cliente.administradores.length > 0;
                  
                  return (
                    <React.Fragment key={rowKey}>
                      <TableRow 
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          },
                          borderBottom: isExpanded ? 'none' : undefined
                        }}
                      >
                        <TableCell sx={{ borderBottom: isExpanded ? 'none' : undefined }}>
                          {hasAdministradores && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newExpanded = new Set(expandedRows);
                                if (isExpanded) {
                                  newExpanded.delete(rowKey);
                                } else {
                                  newExpanded.add(rowKey);
                                }
                                setExpandedRows(newExpanded);
                              }}
                              sx={{
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            >
                              <KeyboardArrowDownIcon />
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell sx={{ borderBottom: isExpanded ? 'none' : undefined }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {cliente.nombre?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {cliente.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cliente.salas?.length || 0} sala{cliente.salas?.length !== 1 ? 's' : ''} asociada{cliente.salas?.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: isExpanded ? 'none' : undefined }}>
                      <Box>
                        {cliente.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            {cliente.email}
                          </Typography>
                        )}
                        {cliente.telefono && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            {cliente.telefono}
                          </Typography>
                        )}
                        {!cliente.email && !cliente.telefono && (
                          <Typography variant="caption" color="text.disabled">
                            Sin contacto registrado
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: isExpanded ? 'none' : undefined }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                        {cliente.salas && cliente.salas.length > 0 ? (
                          cliente.salas.map((sala, idx) => (
                            <Chip 
                              key={idx}
                              label={sala.nombre}
                              size="small"
                              icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                              sx={{ 
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                bgcolor: sala.status === 'active' 
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.grey[500], 0.1),
                                color: sala.status === 'active' 
                                  ? theme.palette.success.main 
                                  : theme.palette.text.disabled,
                                border: `1px solid ${sala.status === 'active' 
                                  ? alpha(theme.palette.success.main, 0.3)
                                  : alpha(theme.palette.grey[500], 0.3)}`,
                                '&:hover': {
                                  bgcolor: sala.status === 'active' 
                                    ? alpha(theme.palette.success.main, 0.2)
                                    : alpha(theme.palette.grey[500], 0.2)
                                }
                              }}
                            />
                          ))
                        ) : (
                          <Chip 
                            label="Sin salas" 
                            size="small"
                            sx={{ 
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: isExpanded ? 'none' : undefined }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Editar cliente" arrow>
                          <IconButton 
                            onClick={() => handleEditCliente(cliente)}
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.warning.main, 0.2)
                              }
                            }}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton 
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setViewDialogOpen(true);
                          }} 
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.2)
                            }
                          }}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {cliente.telefono && (
                          <IconButton 
                            onClick={() => {
                              // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
                              const cleanPhone = cliente.telefono.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/57${cleanPhone}`, '_blank');
                            }}
                            sx={{
                              bgcolor: alpha('#25D366', 0.1),
                              color: '#25D366',
                              '&:hover': {
                                bgcolor: alpha('#25D366', 0.2)
                              }
                            }}
                            size="small"
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        )}
                        {cliente.email && (
                          <IconButton 
                            onClick={() => window.open(`mailto:${cliente.email}`)}
                            sx={{
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.success.main, 0.2)
                              }
                            }}
                            size="small"
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        )}
                        {cliente.telefono && (
                          <IconButton 
                            onClick={() => window.open(`tel:${cliente.telefono}`)}
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.info.main, 0.2)
                              }
                            }}
                            size="small"
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Filas expandibles con administradores (una fila por cada administrador) */}
                  {hasAdministradores && isExpanded && (
                    <React.Fragment>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                        <TableCell colSpan={6} sx={{ py: 1.5, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14 }} />
                            Administradores/Encargados ({cliente.administradores.length})
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {cliente.administradores.map((admin, adminIdx) => (
                        <TableRow
                          key={adminIdx} 
                            sx={{
                              bgcolor: alpha(theme.palette.secondary.main, 0.02),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.secondary.main, 0.06)
                              }
                            }}
                          >
                            {/* Celda vacía para alineación */}
                            <TableCell sx={{ width: 50, pl: 6 }}>
                              <Box sx={{ width: 4, height: 30, bgcolor: alpha(theme.palette.secondary.main, 0.4), borderRadius: 1 }} />
                            </TableCell>

                            {/* Nombre del administrador */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                  color: theme.palette.secondary.main,
                                  width: 36,
                                  height: 36
                                }}>
                                  {admin.nombre?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {admin.nombre}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 500 }}>
                                    Administrador/Encargado
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Contacto */}
                            <TableCell>
                              <Box>
                                {admin.email && (
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontSize: '0.85rem' }}>
                                    <EmailIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                                    {admin.email}
                                  </Typography>
                                )}
                                {admin.telefono && (
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                                    <PhoneIcon sx={{ fontSize: 15, color: 'success.main' }} />
                                    {admin.telefono}
                                  </Typography>
                                )}
                                {!admin.email && !admin.telefono && (
                                  <Typography variant="caption" color="text.disabled">
                                    Sin contacto registrado
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>

                            {/* Salas asociadas */}
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                                {admin.salasAsociadas && admin.salasAsociadas.length > 0 ? (
                                  admin.salasAsociadas.map((salaNombre, salaIdx) => (
                                    <Chip 
                                      key={salaIdx}
                                      label={salaNombre}
                                      size="small"
                                      icon={<BusinessIcon sx={{ fontSize: 13 }} />}
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        height: 22,
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.main,
                                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.secondary.main, 0.2)
                                        }
                                      }}
                                    />
                                  ))
                                ) : (
                                  <Chip 
                                    label="Sin salas" 
                                    size="small"
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.grey[500], 0.1),
                                      color: theme.palette.text.disabled,
                                      fontSize: '0.7rem',
                                      height: 22
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>

                            {/* Acciones */}
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Tooltip title="Editar administrador" arrow>
                                  <IconButton 
                                    onClick={() => handleEditAdmin(admin)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                                      color: theme.palette.warning.main,
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.warning.main, 0.2)
                                      }
                                    }}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {admin.telefono && (
                                  <IconButton 
                                    onClick={() => {
                                      const cleanPhone = admin.telefono.replace(/[^0-9]/g, '');
                                      window.open(`https://wa.me/57${cleanPhone}`, '_blank');
                                    }}
                                    sx={{
                                      bgcolor: alpha('#25D366', 0.1),
                                      color: '#25D366',
                                      '&:hover': {
                                        bgcolor: alpha('#25D366', 0.2)
                                      }
                                    }}
                                    size="small"
                                  >
                                    <WhatsAppIcon fontSize="small" />
                                  </IconButton>
                                )}
                                {admin.email && (
                                  <IconButton 
                                    onClick={() => window.open(`mailto:${admin.email}`)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.success.main, 0.1),
                                      color: theme.palette.success.main,
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.success.main, 0.2)
                                      }
                                    }}
                                    size="small"
                                  >
                                    <EmailIcon fontSize="small" />
                                  </IconButton>
                                )}
                                {admin.telefono && (
                                  <IconButton 
                                    onClick={() => window.open(`tel:${admin.telefono}`)}
                                    sx={{
                                      bgcolor: alpha(theme.palette.info.main, 0.1),
                                      color: theme.palette.info.main,
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.info.main, 0.2)
                                      }
                                    }}
                                    size="small"
                                  >
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                      ))}
                    </React.Fragment>
                  )}
                </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredClientes.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>

      {/* DIALOG DE DETALLES */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
            {selectedCliente?.nombre?.charAt(0)?.toUpperCase()}
          </Avatar>
          Detalles del Cliente
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedCliente && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {selectedCliente.nombre}
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EmailIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">
                      {selectedCliente.email || 'No registrado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon color="success" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Teléfono
                    </Typography>
                    <Typography variant="body2">
                      {selectedCliente.telefono || 'No registrado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Salas Asociadas ({selectedCliente.salas?.length || 0})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedCliente.salas && selectedCliente.salas.length > 0 ? (
                    selectedCliente.salas.map((sala, idx) => (
                      <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {sala.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Empresa: {sala.empresa} • Ciudad: {sala.ciudad}
                            </Typography>
                          </Box>
                          <Chip 
                            label={sala.status === 'active' ? 'Activa' : 'Inactiva'}
                            color={sala.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Sin salas asociadas
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>



      {/* ============================================ */}
      {/* MODAL DE EDICIÓN DE CLIENTE */}
      {/* ============================================ */}
      <Dialog 
        open={editClienteDialogOpen} 
        onClose={handleCloseEditClienteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2.5
        }}>
          <EditIcon />
          Editar Cliente
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Los cambios se sincronizarán automáticamente en <strong>todas las salas</strong> donde aparece este cliente.
          </Alert>
          
          <TextField
            autoFocus
            label="Nombre del Cliente"
            fullWidth
            value={editClienteForm.nombre}
            onChange={(e) => setEditClienteForm({ ...editClienteForm, nombre: e.target.value })}
            sx={{ mb: 2 }}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={editClienteForm.email}
            onChange={(e) => setEditClienteForm({ ...editClienteForm, email: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Teléfono"
            fullWidth
            value={editClienteForm.telefono}
            onChange={(e) => setEditClienteForm({ ...editClienteForm, telefono: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="success" />
                </InputAdornment>
              )
            }}
          />

          {clienteToEdit && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Se actualizarán <strong>{clienteToEdit.salas?.length || 0} sala(s)</strong> donde aparece "{clienteToEdit.nombre}"
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseEditClienteDialog}
            startIcon={<CloseIcon />}
            disabled={updatingCliente}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateCliente}
            variant="contained"
            color="warning"
            startIcon={updatingCliente ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={updatingCliente || !editClienteForm.nombre.trim()}
          >
            {updatingCliente ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL DE EDICIÓN DE ADMINISTRADOR */}
      {/* ============================================ */}
      <Dialog 
        open={editAdminDialogOpen} 
        onClose={handleCloseEditAdminDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2.5
        }}>
          <EditIcon />
          Editar Administrador/Encargado
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Los cambios se sincronizarán automáticamente en <strong>todas las salas</strong> donde trabaja este administrador.
          </Alert>
          
          <TextField
            autoFocus
            label="Nombre del Administrador"
            fullWidth
            value={editAdminForm.nombre}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, nombre: e.target.value })}
            sx={{ mb: 2 }}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="secondary" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={editAdminForm.email}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Teléfono"
            fullWidth
            value={editAdminForm.telefono}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, telefono: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="success" />
                </InputAdornment>
              )
            }}
          />

          {adminToEdit && adminToEdit.salasAsociadas && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Se actualizarán las salas donde trabaja "{adminToEdit.nombre}": <strong>{adminToEdit.salasAsociadas.join(', ')}</strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseEditAdminDialog}
            startIcon={<CloseIcon />}
            disabled={updatingAdmin}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateAdmin}
            variant="contained"
            color="secondary"
            startIcon={updatingAdmin ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={updatingAdmin || !editAdminForm.nombre.trim()}
          >
            {updatingAdmin ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientesPage;
