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
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { 
  collection, 
  query, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

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

  // Cargar clientes desde las salas en Firestore
  // Solo procesamos contactoAutorizado (propietarios), NO contactoAutorizado2 (empleados/admins)
  useEffect(() => {
    const q = query(collection(db, 'salas'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Agrupar salas por cliente (solo propietarios - contactoAutorizado)
        const clientesMap = new Map();
        
        snapshot.docs.forEach(doc => {
          const sala = { id: doc.id, ...doc.data() };
          
          // Procesar SOLO contacto autorizado 1 (propietario de la sala = cliente real)
          if (sala.contactoAutorizado && sala.contactoAutorizado.trim()) {
            const clienteKey = sala.contactoAutorizado.toLowerCase().trim();
            
            if (!clientesMap.has(clienteKey)) {
              clientesMap.set(clienteKey, {
                nombre: sala.contactoAutorizado,
                email: sala.contactEmail || '',
                telefono: sala.contactPhone || '',
                salas: []
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
        });
        
        // Convertir Map a Array y ordenar por nombre
        const clientesData = Array.from(clientesMap.values())
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setClientes(clientesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading clientes:', err);
        setError('Error al cargar clientes (propietarios) desde salas');
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
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
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
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Salas Anexas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClientes.map((cliente, index) => (
                  <TableRow 
                    key={`${cliente.nombre}-${index}`} 
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      },
                      '&:not(:last-child)': {
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }
                    }}
                  >
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
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
                ))
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
    </Box>
  );
};

export default ClientesPage;
