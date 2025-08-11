// ModalesShowcase.jsx - Design System 3.0 - MODELOS DE MODALES Y DIÁLOGOS PROFESIONALES
import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  IconButton,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Warning,
  Info,
  CheckCircle,
  Error,
  Delete,
  Edit,
  Save,
  Cancel,
  Settings,
  Filter,
  Download,
  Upload,
  Close,
  ExpandMore,
  Help,
  Security,
  Business,
  AttachMoney,
  Assignment
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ModalesShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('confirmacion');
  const [openModal, setOpenModal] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [modalType, setModalType] = useState('');

  // Estados para diferentes modales
  const [compromisoData, setCompromisoData] = useState({
    nombre: '',
    monto: '',
    empresa: '',
    fecha: ''
  });

  const categories = [
    { id: 'confirmacion', label: 'Confirmación', icon: '⚠️' },
    { id: 'formularios', label: 'Formularios', icon: '📝' },
    { id: 'informativos', label: 'Informativos', icon: 'ℹ️' },
    { id: 'drawers', label: 'Drawers', icon: '📋' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' }
  ];

  const renderConfirmacionModales = () => (
    <Grid container spacing={3}>
      {/* Modal de Eliminación */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            ⚠️ Modal de Eliminación Crítica
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para acciones destructivas que requieren confirmación explícita. 
            Incluye información del elemento y consecuencias claras.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              setModalType('eliminacion');
              setOpenModal(true);
            }}
            startIcon={<Delete />}
            sx={{ mb: 2 }}
          >
            Eliminar Compromiso
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal con información detallada del elemento a eliminar, 
            advertencias claras y botones de confirmación destacados.
          </Typography>
        </Paper>
      </Grid>

      {/* Modal de Confirmación de Pago */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="warning.main" gutterBottom>
            💰 Confirmación de Transacción
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para confirmar transacciones financieras importantes. 
            Muestra resumen completo antes de procesar.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => {
              setModalType('pago');
              setOpenModal(true);
            }}
            startIcon={<AttachMoney />}
            sx={{ mb: 2 }}
          >
            Procesar Pago
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal con resumen de transacción, métodos de pago disponibles 
            y confirmación de seguridad.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFormulariosModales = () => (
    <Grid container spacing={3}>
      {/* Modal de Creación Rápida */}
      <Grid item xs={12} lg={8}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📝 Creación Rápida de Compromiso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Formularios completos dentro de modales para creación rápida 
            sin perder contexto de la página actual.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setModalType('formulario');
              setOpenModal(true);
            }}
            startIcon={<Assignment />}
            sx={{ mb: 2 }}
          >
            Nuevo Compromiso
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal con formulario completo, validación en tiempo real 
            y guardado automático de borrador.
          </Typography>
        </Paper>
      </Grid>

      {/* Modal Compacto */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            ⚡ Modal Compacto
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para ediciones rápidas o datos simples.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content'
        }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              setModalType('compacto');
              setOpenModal(true);
            }}
            startIcon={<Edit />}
            sx={{ mb: 2 }}
            fullWidth
          >
            Edición Rápida
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal minimalista para cambios específicos.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderInformativosModales = () => (
    <Grid container spacing={3}>
      {/* Modal de Información Detallada */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            ℹ️ Información Detallada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para mostrar información completa sin permitir edición.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            color="info"
            onClick={() => {
              setModalType('informativo');
              setOpenModal(true);
            }}
            startIcon={<Info />}
            sx={{ mb: 2 }}
          >
            Ver Detalles
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal de solo lectura con información organizada 
            y opciones de exportación.
          </Typography>
        </Paper>
      </Grid>

      {/* Modal de Ayuda */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            ❓ Centro de Ayuda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para guías, tutoriales y documentación contextual.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="outlined" 
            color="success"
            onClick={() => {
              setModalType('ayuda');
              setOpenModal(true);
            }}
            startIcon={<Help />}
            sx={{ mb: 2 }}
          >
            Abrir Ayuda
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Modal con navegación por secciones, búsqueda 
            y contenido contextual.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDrawersModales = () => (
    <Grid container spacing={3}>
      {/* Drawer de Filtros */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🔍 Drawer de Filtros Avanzados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para filtros complejos sin perder vista de los resultados.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            onClick={() => setOpenDrawer(true)}
            startIcon={<Filter />}
            sx={{ mb: 2 }}
          >
            Abrir Filtros
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Drawer lateral con filtros organizados por categorías, 
            aplicación en tiempo real y guardado de configuraciones.
          </Typography>
        </Paper>
      </Grid>

      {/* Drawer de Configuraciones */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="secondary.main" gutterBottom>
            ⚙️ Panel de Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para ajustes y preferencias de usuario.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => setOpenDrawer(true)}
            startIcon={<Settings />}
            sx={{ mb: 2 }}
          >
            Configuración
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Drawer con secciones colapsables, preview en tiempo real 
            y aplicación inmediata de cambios.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderNotificacionesModales = () => (
    <Grid container spacing={3}>
      {/* Snackbars */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            🔔 Sistema de Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para feedback inmediato de acciones del usuario.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              color="success"
              onClick={() => setSnackbarOpen(true)}
              size="small"
            >
              Éxito
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => setSnackbarOpen(true)}
              size="small"
            >
              Error
            </Button>
            <Button 
              variant="contained" 
              color="warning"
              onClick={() => setSnackbarOpen(true)}
              size="small"
            >
              Advertencia
            </Button>
            <Button 
              variant="contained" 
              color="info"
              onClick={() => setSnackbarOpen(true)}
              size="small"
            >
              Información
            </Button>
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            Notificaciones toast con diferentes tipos, auto-dismissal 
            y acciones integradas (deshacer, ver detalles).
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderActiveSection = () => {
    switch(activeCategory) {
      case 'confirmacion': return renderConfirmacionModales();
      case 'formularios': return renderFormulariosModales();
      case 'informativos': return renderInformativosModales();
      case 'drawers': return renderDrawersModales();
      case 'notificaciones': return renderNotificacionesModales();
      default: return renderConfirmacionModales();
    }
  };

  const renderModal = () => {
    const getModalConfig = () => {
      switch(modalType) {
        case 'eliminacion':
          return {
            title: 'Confirmar Eliminación',
            icon: <Delete />,
            color: 'error',
            maxWidth: 'sm'
          };
        case 'pago':
          return {
            title: 'Confirmar Transacción',
            icon: <AttachMoney />,
            color: 'warning',
            maxWidth: 'sm'
          };
        case 'formulario':
          return {
            title: 'Nuevo Compromiso',
            icon: <Assignment />,
            color: 'primary',
            maxWidth: 'md'
          };
        case 'compacto':
          return {
            title: 'Edición Rápida',
            icon: <Edit />,
            color: 'info',
            maxWidth: 'xs'
          };
        case 'informativo':
          return {
            title: 'Información Detallada',
            icon: <Info />,
            color: 'info',
            maxWidth: 'lg'
          };
        case 'ayuda':
          return {
            title: 'Centro de Ayuda',
            icon: <Help />,
            color: 'success',
            maxWidth: 'md'
          };
        default:
          return {
            title: 'Modal',
            icon: <Info />,
            color: 'primary',
            maxWidth: 'sm'
          };
      }
    };

    const config = getModalConfig();

    return (
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth={config.maxWidth} 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        {/* HEADER DEL MODAL */}
        <DialogTitle sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
            }}>
              {config.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {config.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {modalType === 'eliminacion' && 'Acción irreversible - Confirmar eliminación'}
                {modalType === 'pago' && 'Verificar datos antes de procesar'}
                {modalType === 'formulario' && 'Crear nuevo compromiso financiero'}
                {modalType === 'compacto' && 'Modificación rápida de datos'}
                {modalType === 'informativo' && 'Información completa del elemento'}
                {modalType === 'ayuda' && 'Documentación y guías de uso'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {modalType === 'eliminacion' && (
            <Box>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ⚠️ Esta acción no se puede deshacer
                </Typography>
                <Typography variant="body2">
                  Se eliminará permanentemente el compromiso y todos sus datos asociados.
                </Typography>
              </Alert>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Compromiso a eliminar:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  Arriendo Local Principal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  DR Group SAS • $2.500.000 • Vence: 15 Ago 2025
                </Typography>
              </Box>
            </Box>
          )}

          {modalType === 'pago' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resumen de Transacción
              </Typography>
              
              <Box sx={{ 
                p: 3, 
                bgcolor: 'warning.50', 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'warning.100',
                mb: 3
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Compromiso:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Arriendo Local Principal
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Monto:
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                      $2.500.000 COP
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      DR Group SAS
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Método de Pago:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Transferencia Bancaria
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {modalType === 'formulario' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Compromiso"
                  value={compromisoData.nombre}
                  onChange={(e) => setCompromisoData({...compromisoData, nombre: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monto"
                  value={compromisoData.monto}
                  onChange={(e) => setCompromisoData({...compromisoData, monto: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    value={compromisoData.empresa}
                    onChange={(e) => setCompromisoData({...compromisoData, empresa: e.target.value})}
                    label="Empresa"
                  >
                    <MenuItem value="dr-group">DR Group SAS</MenuItem>
                    <MenuItem value="dr-construcciones">DR Construcciones</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  value={compromisoData.fecha}
                  onChange={(e) => setCompromisoData({...compromisoData, fecha: e.target.value})}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {modalType === 'compacto' && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nuevo Monto"
                defaultValue="$2.500.000"
                size="medium"
              />
              <TextField
                fullWidth
                type="date"
                label="Nueva Fecha"
                defaultValue="2025-08-15"
                InputLabelProps={{
                  shrink: true,
                }}
                size="medium"
              />
            </Stack>
          )}

          {modalType === 'informativo' && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Detalles del Compromiso
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Nombre:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Arriendo Local Principal
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Descripción:
                      </Typography>
                      <Typography variant="body1">
                        Pago mensual del arriendo del local principal ubicado en el centro comercial.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Estado:
                      </Typography>
                      <Chip label="Vigente" color="success" size="small" />
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Información Financiera
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Monto Mensual:
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                      $2.500.000
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Próximo Vencimiento:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      15 Agosto, 2025
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {modalType === 'ayuda' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                ¿Cómo gestionar compromisos?
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Crear un nuevo compromiso</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Para crear un nuevo compromiso, haz clic en "Nuevo Compromiso" 
                    y completa todos los campos requeridos...
                  </Typography>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Realizar pagos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Los pagos se pueden registrar desde la sección de compromisos...
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            variant="outlined"
            startIcon={<Cancel />}
            sx={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(102, 126, 234, 0.08)'
              }
            }}
          >
            {modalType === 'informativo' || modalType === 'ayuda' ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          {modalType !== 'informativo' && modalType !== 'ayuda' && (
            <Button 
              variant="contained" 
              color={config.color}
              startIcon={modalType === 'eliminacion' ? <Delete /> : <Save />}
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                }
              }}
            >
              {modalType === 'eliminacion' && 'Eliminar'}
              {modalType === 'pago' && 'Procesar Pago'}
              {modalType === 'formulario' && 'Crear Compromiso'}
              {modalType === 'compacto' && 'Guardar Cambios'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* HEADER DEL SHOWCASE */}
      <Box sx={{ 
        mb: 4,
        p: 3,
        bgcolor: 'primary.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.100'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          🎭 Modales y Diálogos - Design System 3.0
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Colección de modales, diálogos y drawers profesionales siguiendo los estándares 
          de diseño empresarial. Cada componente está optimizado para diferentes casos de uso.
        </Typography>
        
        {/* NAVEGACIÓN DE CATEGORÍAS */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.label}`}
              variant={activeCategory === category.id ? 'filled' : 'outlined'}
              color={activeCategory === category.id ? 'primary' : 'default'}
              onClick={() => setActiveCategory(category.id)}
              sx={{ 
                fontWeight: activeCategory === category.id ? 600 : 400,
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* CONTENIDO ACTIVO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveSection()}
        </motion.div>
      </AnimatePresence>

      {/* DRAWER EJEMPLO */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: 400,
            p: 3
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros Avanzados
          </Typography>
          <IconButton onClick={() => setOpenDrawer(false)}>
            <Close />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Empresa</InputLabel>
            <Select label="Empresa" defaultValue="">
              <MenuItem value="dr-group">DR Group SAS</MenuItem>
              <MenuItem value="dr-construcciones">DR Construcciones</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" defaultValue="">
              <MenuItem value="vigente">Vigente</MenuItem>
              <MenuItem value="vencido">Vencido</MenuItem>
              <MenuItem value="pagado">Pagado</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Rango de Montos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Mínimo"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Máximo"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Stack>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="outlined" fullWidth>
            Limpiar
          </Button>
          <Button variant="contained" fullWidth>
            Aplicar
          </Button>
        </Box>
      </Drawer>

      {/* MODAL DINÁMICO */}
      {renderModal()}

      {/* SNACKBAR EJEMPLO */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          variant="filled"
          sx={{ borderRadius: 1 }}
        >
          ✅ Acción completada exitosamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModalesShowcase;
