/**
 * 🎭 Design System 3.0 - Modales y Diálogos Unificados
 * Página consolidada con índice lateral y ejemplos funcionales completos
 * USO COMPLETO de tokens DS 3.0 - overlays tokenizados 100%
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Snackbar,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Chip,
  Card,
  CardContent,
  Badge,
  Fab,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuestionAnswer,
  Assignment,
  Info,
  ViewSidebar,
  Notifications,
  CheckCircle,
  Warning,
  Error,
  InfoOutlined,
  Close,
  Delete,
  AttachMoney,
  Business,
  Person,
  Email,
  Phone,
  Save,
  Cancel,
  Menu,
  Receipt,
  Payment,
  Today,
  KeyboardArrowUp
} from '@mui/icons-material';

// 🎨 Importar tokens DS 3.0 - Sistema completo
import { formUtils, formatCOP } from '../../theme/tokens/forms.js';
import { overlayUtils } from '../../theme/tokens/overlays.js';

/**
 * 🎭 PÁGINA PRINCIPAL - Modales y Diálogos Unificados
 */
const ModalsUnifiedPage = () => {
  // 📋 Estados para navegación lateral
  const [activeSection, setActiveSection] = useState('confirmation');
  
  // Referencias para anclas
  const confirmationRef = useRef(null);
  const formsRef = useRef(null);
  const informativeRef = useRef(null);
  const drawersRef = useRef(null);
  const notificationsRef = useRef(null);

  // 🎭 Estados para modales de confirmación
  const [simpleConfirmOpen, setSimpleConfirmOpen] = useState(false);
  const [destructiveConfirmOpen, setDestructiveConfirmOpen] = useState(false);
  const [transactionConfirmOpen, setTransactionConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 📝 Estados para modales de formulario
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [businessData, setBusinessData] = useState({ company: '', concept: '', amount: '' });
  const [formLoading, setFormLoading] = useState(false);

  // ℹ️ Estados para modales informativos
  const [infoModalOpen, setInfoModalOpen] = useState({ type: null, variant: 'compact' });

  // 📂 Estados para drawers - valores seguros para MUI
  const [drawerOpen, setDrawerOpen] = useState({ side: null, content: null });

  // 🔔 Estados para notificaciones
  const [snackbars, setSnackbars] = useState([]);
  const [bannerVisible, setBannerVisible] = useState(true);

  // 📍 Navegación lateral - configuración
  const navigationItems = [
    { id: 'confirmation', label: 'Confirmación', icon: <QuestionAnswer />, ref: confirmationRef },
    { id: 'forms', label: 'Formularios', icon: <Assignment />, ref: formsRef },
    { id: 'informative', label: 'Informativos', icon: <Info />, ref: informativeRef },
    { id: 'drawers', label: 'Drawers', icon: <ViewSidebar />, ref: drawersRef },
    { id: 'notifications', label: 'Notificaciones', icon: <Notifications />, ref: notificationsRef }
  ];

  // 📜 Scroll spy para navegación activa
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map(item => ({
        id: item.id,
        element: item.ref.current,
        offsetTop: item.ref.current?.offsetTop || 0
      }));

      const scrollPosition = window.scrollY + 200;
      const currentSection = sections
        .filter(section => scrollPosition >= section.offsetTop)
        .pop();

      if (currentSection && currentSection.id !== activeSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection, navigationItems]);

  // 🎯 Funciones para confirmaciones
  const handleSimpleConfirm = async () => {
    setConfirmLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular operación
    setConfirmLoading(false);
    setSimpleConfirmOpen(false);
    addSnackbar('Acción confirmada correctamente', 'success');
  };

  const handleDestructiveConfirm = async () => {
    setConfirmLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular eliminación
    setConfirmLoading(false);
    setDestructiveConfirmOpen(false);
    addSnackbar('Elemento eliminado permanentemente', 'info');
  };

  const handleTransactionConfirm = async () => {
    setConfirmLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simular transacción
    setConfirmLoading(false);
    setTransactionConfirmOpen(false);
    addSnackbar('Transacción procesada exitosamente', 'success');
  };

  // 📝 Funciones para formularios
  const handleLoginSubmit = async () => {
    if (!loginData.email || !loginData.password) {
      addSnackbar('Por favor completa todos los campos', 'warning');
      return;
    }
    
    setFormLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFormLoading(false);
    setLoginModalOpen(false);
    setLoginData({ email: '', password: '' });
    addSnackbar('Sesión iniciada correctamente', 'success');
  };

  const handleBusinessSubmit = async () => {
    if (!businessData.company || !businessData.concept || !businessData.amount) {
      addSnackbar('Por favor completa todos los campos', 'warning');
      return;
    }
    
    setFormLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1800));
    setFormLoading(false);
    setBusinessModalOpen(false);
    setBusinessData({ company: '', concept: '', amount: '' });
    addSnackbar('Compromiso empresarial registrado', 'success');
  };

  // 🔔 Sistema de snackbars
  const addSnackbar = (message, severity = 'info') => {
    const newSnackbar = {
      id: Date.now() + Math.random(),
      message,
      severity,
      open: true
    };
    
    setSnackbars(prev => [...prev.slice(-2), newSnackbar]); // Máximo 3 snackbars
    
    // Auto hide después de 4 segundos
    setTimeout(() => {
      setSnackbars(prev => prev.map(snack => 
        snack.id === newSnackbar.id ? { ...snack, open: false } : snack
      ));
    }, 4000);
  };

  const removeSnackbar = (id) => {
    setSnackbars(prev => prev.filter(snack => snack.id !== id));
  };

  // 🎯 Scroll suave a sección
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* 🎨 Header Management DS 3.0 */}
      <Box sx={formUtils.createSectionHeader('', '', 'management').containerSx}>
        <Typography {...formUtils.createSectionHeader('Modales y Diálogos — Design System 3.0', 'Sistema unificado de ventanas emergentes, confirmaciones y notificaciones', 'management').titleProps} />
        <Typography {...formUtils.createSectionHeader('Modales y Diálogos — Design System 3.0', 'Sistema unificado de ventanas emergentes, confirmaciones y notificaciones', 'management').subtitleProps} />
      </Box>

      {/* 📋 Banner informativo persistente */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              {...overlayUtils.createBannerProps('info')}
              sx={{
                ...overlayUtils.createBannerProps('info').sx,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InfoOutlined className="banner-icon" />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Ejemplos interactivos disponibles
                  </Typography>
                  <Typography variant="caption">
                    Todos los modales incluyen accesibilidad completa y focus management
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setBannerVisible(false)}
                className="banner-close"
              >
                <Close fontSize="small" />
              </IconButton>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={4}>
        
        {/* 📋 ÍNDICE LATERAL STICKY */}
        <Grid item xs={12} md={3}>
          <Paper 
            sx={{
              position: 'sticky',
              top: 24,
              p: 2,
              ...formUtils.getFormPaper('accent', 'primary')
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Navegación
            </Typography>
            <List>
              {navigationItems.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={activeSection === item.id}
                    onClick={() => scrollToSection(item.ref)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.50',
                        borderLeft: '3px solid',
                        borderLeftColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: activeSection === item.id ? 'primary.main' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: activeSection === item.id ? 600 : 400,
                        color: activeSection === item.id ? 'primary.main' : 'text.primary'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 📄 CONTENIDO PRINCIPAL */}
        <Grid item xs={12} md={9}>
          <Stack spacing={6}>

            {/* ⚡ SECCIÓN 1: CONFIRMACIÓN */}
            <Box ref={confirmationRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Paper sx={{ ...formUtils.getFormPaper('accent', 'primary'), p: 4 }}>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                    1. Confirmación
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Diálogos de confirmación para acciones críticas con diferentes niveles de severidad
                  </Typography>

                  <Grid container spacing={3}>
                    
                    {/* Confirmación Simple */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Simple
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Confirmación básica para acciones seguras
                          </Typography>
                          <Button 
                            variant="outlined"
                            onClick={() => setSimpleConfirmOpen(true)}
                            {...formUtils.createButtonProps('secondary', 'medium')}
                          >
                            Abrir confirmación
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Confirmación Destructiva */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Destructiva Crítica
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Para acciones irreversibles como eliminación
                          </Typography>
                          <Button 
                            variant="outlined"
                            color="error"
                            onClick={() => setDestructiveConfirmOpen(true)}
                            sx={{
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'error.50',
                                borderColor: 'error.dark'
                              }
                            }}
                          >
                            Eliminar elemento
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Confirmación Transacción */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Transacción
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Resumen de transacción con detalles COP
                          </Typography>
                          <Button 
                            variant="contained"
                            onClick={() => setTransactionConfirmOpen(true)}
                            {...formUtils.createButtonProps('primary', 'medium')}
                          >
                            Procesar pago
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Box>

            {/* ⚡ SECCIÓN 2: FORMULARIOS */}
            <Box ref={formsRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Paper sx={{ ...formUtils.getFormPaper('accent', 'success'), p: 4 }}>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                    2. Formularios en Modal
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Modales con formularios integrados, validación y estados de carga
                  </Typography>

                  <Grid container spacing={3}>
                    
                    {/* Login Modal */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Login Rápido
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Modal de autenticación con validación
                          </Typography>
                          <Button 
                            variant="outlined"
                            onClick={() => setLoginModalOpen(true)}
                            {...formUtils.createButtonProps('secondary', 'medium')}
                          >
                            Abrir login
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Business Modal */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Registro Empresarial
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            Formulario con formato COP y validación
                          </Typography>
                          <Button 
                            variant="contained"
                            onClick={() => setBusinessModalOpen(true)}
                            {...formUtils.createButtonProps('primary', 'medium')}
                          >
                            Nuevo compromiso
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Box>

            {/* ⚡ SECCIÓN 3: INFORMATIVOS */}
            <Box ref={informativeRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Paper sx={{ ...formUtils.getFormPaper('accent', 'info'), p: 4 }}>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                    3. Informativos
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Diálogos para mostrar información, resultados y estados del sistema
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CheckCircle />}
                        onClick={() => setInfoModalOpen({ type: 'success', variant: 'compact' })}
                        sx={{ color: 'success.main', borderColor: 'success.main' }}
                      >
                        Éxito
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Warning />}
                        onClick={() => setInfoModalOpen({ type: 'warning', variant: 'compact' })}
                        sx={{ color: 'warning.main', borderColor: 'warning.main' }}
                      >
                        Advertencia
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Error />}
                        onClick={() => setInfoModalOpen({ type: 'error', variant: 'compact' })}
                        sx={{ color: 'error.main', borderColor: 'error.main' }}
                      >
                        Error
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<InfoOutlined />}
                        onClick={() => setInfoModalOpen({ type: 'info', variant: 'detailed' })}
                        sx={{ color: 'info.main', borderColor: 'info.main' }}
                      >
                        Info Detallada
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Box>

            {/* ⚡ SECCIÓN 4: DRAWERS */}
            <Box ref={drawersRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Paper sx={{ ...formUtils.getFormPaper('accent', 'warning'), p: 4 }}>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                    4. Drawers
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Paneles deslizantes para navegación, formularios extensos y detalles
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Menu />}
                        onClick={() => setDrawerOpen({ side: 'left', content: 'navigation' })}
                        {...formUtils.createButtonProps('secondary', 'large')}
                      >
                        Drawer Izquierdo
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Assignment />}
                        onClick={() => setDrawerOpen({ side: 'right', content: 'form' })}
                        {...formUtils.createButtonProps('primary', 'large')}
                      >
                        Drawer Formulario
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Box>

            {/* ⚡ SECCIÓN 5: NOTIFICACIONES */}
            <Box ref={notificationsRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Paper sx={{ ...formUtils.getFormPaper('accent', 'error'), p: 4 }}>
                  <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                    5. Notificaciones
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Sistema de notificaciones con snackbars, toasts y banners persistentes
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => addSnackbar('Operación completada correctamente', 'success')}
                        sx={{ color: 'success.main', borderColor: 'success.main' }}
                      >
                        Éxito
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => addSnackbar('Revisa los datos ingresados', 'warning')}
                        sx={{ color: 'warning.main', borderColor: 'warning.main' }}
                      >
                        Advertencia
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => addSnackbar('Error al procesar la solicitud', 'error')}
                        sx={{ color: 'error.main', borderColor: 'error.main' }}
                      >
                        Error
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => addSnackbar('Nueva actualización disponible', 'info')}
                        sx={{ color: 'info.main', borderColor: 'info.main' }}
                      >
                        Información
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Indicador de snackbars activos */}
                  {snackbars.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Snackbars activos: {snackbars.filter(s => s.open).length}/3
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            </Box>

          </Stack>
        </Grid>
      </Grid>

      {/* 🎭 MODALES DE CONFIRMACIÓN */}
      
      {/* Confirmación Simple */}
      <Dialog
        open={simpleConfirmOpen}
        onClose={() => setSimpleConfirmOpen(false)}
        {...overlayUtils.createDialogProps('confirmation', 'md')}
        {...overlayUtils.getAriaDialogProps('simple-confirm-title', 'simple-confirm-description', false)}
      >
        <DialogTitle 
          id="simple-confirm-title" 
          {...overlayUtils.createDialogHeaderProps('confirmation')}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'inherit' }}>
            Confirmar Acción
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography id="simple-confirm-description" sx={{ color: 'text.secondary' }}>
            ¿Estás seguro de que deseas proceder con esta acción? Esta operación es reversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setSimpleConfirmOpen(false)}
            {...formUtils.createButtonProps('secondary', 'medium')}
            disabled={confirmLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSimpleConfirm}
            {...formUtils.createButtonProps('primary', 'medium')}
            disabled={confirmLoading}
            startIcon={confirmLoading ? <CircularProgress size={16} /> : null}
          >
            {confirmLoading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación Destructiva */}
      <Dialog
        open={destructiveConfirmOpen}
        onClose={() => setDestructiveConfirmOpen(false)}
        {...overlayUtils.createDialogProps('destructive', 'md')}
        {...overlayUtils.getAriaDialogProps('destructive-confirm-title', 'destructive-confirm-description', true)}
        disableEscapeKeyDown={confirmLoading}
      >
        <DialogTitle 
          id="destructive-confirm-title" 
          {...overlayUtils.createDialogHeaderProps('destructive')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Delete />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'inherit' }}>
              Eliminar Elemento
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography id="destructive-confirm-description" sx={{ mb: 2 }}>
            <strong>⚠️ Esta acción no se puede deshacer.</strong>
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            El elemento será eliminado permanentemente del sistema y no podrá ser recuperado.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDestructiveConfirmOpen(false)}
            {...formUtils.createButtonProps('secondary', 'medium')}
            disabled={confirmLoading}
          >
            No, mantener
          </Button>
          <Button 
            onClick={handleDestructiveConfirm}
            variant="contained"
            color="error"
            disabled={confirmLoading}
            startIcon={confirmLoading ? <CircularProgress size={16} /> : <Delete />}
            sx={{
              backgroundColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            {confirmLoading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de Transacción */}
      <Dialog
        open={transactionConfirmOpen}
        onClose={() => setTransactionConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="transaction-confirm-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle id="transaction-confirm-title">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Confirmar Transacción
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Resumen de la transacción:
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Concepto:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Arriendo Oficina Principal
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Monto:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCOP(2500000)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Método:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Transferencia Bancaria
                </Typography>
              </Box>
            </Stack>
          </Paper>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Una vez confirmada, la transacción será procesada inmediatamente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setTransactionConfirmOpen(false)}
            {...formUtils.createButtonProps('secondary', 'medium')}
            disabled={confirmLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleTransactionConfirm}
            {...formUtils.createButtonProps('primary', 'medium')}
            disabled={confirmLoading}
            startIcon={confirmLoading ? <CircularProgress size={16} /> : <Payment />}
          >
            {confirmLoading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📝 MODALES DE FORMULARIO */}
      
      {/* Login Modal */}
      <Dialog
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="login-modal-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle id="login-modal-title">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Iniciar Sesión
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              {...formUtils.createFieldProps({ type: 'email', size: 'large' })}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              {...formUtils.createFieldProps({ type: 'password', size: 'large' })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setLoginModalOpen(false)}
            {...formUtils.createButtonProps('secondary', 'medium')}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleLoginSubmit}
            {...formUtils.createButtonProps('primary', 'medium')}
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} /> : null}
          >
            {formLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Business Modal */}
      <Dialog
        open={businessModalOpen}
        onClose={() => setBusinessModalOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="business-modal-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle id="business-modal-title">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Nuevo Compromiso Empresarial
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Empresa"
              value={businessData.company}
              onChange={(e) => setBusinessData({ ...businessData, company: e.target.value })}
              fullWidth
              required
              placeholder="DR Group S.A.S."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              {...formUtils.createFieldProps({ size: 'large' })}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Concepto del Compromiso</InputLabel>
              <Select
                value={businessData.concept}
                onChange={(e) => setBusinessData({ ...businessData, concept: e.target.value })}
                label="Concepto del Compromiso"
                {...formUtils.createFieldProps({ type: 'select', size: 'large' })}
              >
                <MenuItem value="arriendo">Arriendo Oficina Principal</MenuItem>
                <MenuItem value="energia">Energía Eléctrica</MenuItem>
                <MenuItem value="nomina">Nómina Empleados</MenuItem>
                <MenuItem value="seguros">Seguro Vehículos</MenuItem>
                <MenuItem value="servicios">Servicios Públicos</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Monto Comprometido"
              value={businessData.amount}
              onChange={(e) => setBusinessData({ ...businessData, amount: formatCOP(e.target.value) })}
              fullWidth
              required
              placeholder="$ 0"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: 'success.main' }} />
                  </InputAdornment>
                )
              }}
              {...formUtils.createFieldProps({ size: 'large' })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setBusinessModalOpen(false)}
            {...formUtils.createButtonProps('secondary', 'medium')}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleBusinessSubmit}
            {...formUtils.createButtonProps('primary', 'medium')}
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} /> : <Save />}
          >
            {formLoading ? 'Guardando...' : 'Guardar Compromiso'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ℹ️ MODALES INFORMATIVOS */}
      <Dialog
        open={infoModalOpen.type !== null}
        onClose={() => setInfoModalOpen({ type: null, variant: 'compact' })}
        maxWidth="sm"
        fullWidth
        aria-labelledby="info-modal-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderTop: '4px solid',
            borderTopColor: infoModalOpen.type ? `${infoModalOpen.type}.main` : 'primary.main'
          }
        }}
      >
        <DialogTitle id="info-modal-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {infoModalOpen.type === 'success' && <CheckCircle sx={{ color: 'success.main' }} />}
            {infoModalOpen.type === 'warning' && <Warning sx={{ color: 'warning.main' }} />}
            {infoModalOpen.type === 'error' && <Error sx={{ color: 'error.main' }} />}
            {infoModalOpen.type === 'info' && <InfoOutlined sx={{ color: 'info.main' }} />}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {infoModalOpen.type === 'success' && 'Operación Exitosa'}
              {infoModalOpen.type === 'warning' && 'Advertencia'}
              {infoModalOpen.type === 'error' && 'Error del Sistema'}
              {infoModalOpen.type === 'info' && 'Información Importante'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {infoModalOpen.variant === 'compact' ? (
            <Typography>
              {infoModalOpen.type === 'success' && 'La operación se completó correctamente.'}
              {infoModalOpen.type === 'warning' && 'Por favor revisa los datos antes de continuar.'}
              {infoModalOpen.type === 'error' && 'Se produjo un error inesperado.'}
              {infoModalOpen.type === 'info' && 'Tienes notificaciones pendientes por revisar.'}
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Typography>
                Esta es una versión detallada del modal informativo con más contexto y opciones.
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Detalles técnicos:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  • Timestamp: {new Date().toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  • Sistema: Design System 3.0
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  • Estado: Activo
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setInfoModalOpen({ type: null, variant: 'compact' })}
            {...formUtils.createButtonProps('primary', 'medium')}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📂 DRAWERS */}
      <Drawer
        {...overlayUtils.createDrawerProps(
          (['left', 'right', 'top', 'bottom'].includes(drawerOpen.side)) ? drawerOpen.side : 'right',
          drawerOpen.content === 'navigation' ? 'navigation' : 'form'
        )}
        open={drawerOpen.side !== null}
        onClose={() => setDrawerOpen({ side: null, content: null })}
      >
        <Box {...overlayUtils.createDrawerHeaderProps()}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {drawerOpen.content === 'navigation' ? 'Navegación' : 'Formulario Extendido'}
          </Typography>
          <IconButton onClick={() => setDrawerOpen({ side: null, content: null })}>
            <Close />
          </IconButton>
        </Box>
        
        <Box {...overlayUtils.createDrawerBodyProps()}>
          {drawerOpen.content === 'navigation' ? (
            <List>
              {['Dashboard', 'Compromisos', 'Transacciones', 'Reportes', 'Configuración'].map((text, index) => (
                <ListItem key={text} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      {index === 0 && <InfoOutlined />}
                      {index === 1 && <Receipt />}
                      {index === 2 && <Payment />}
                      {index === 3 && <Assignment />}
                      {index === 4 && <Person />}
                    </ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="Título del Documento"
                fullWidth
                {...formUtils.createFieldProps({ size: 'large' })}
              />
              <TextField
                label="Descripción"
                multiline
                rows={4}
                fullWidth
                {...formUtils.createFieldProps({ type: 'multiline', size: 'medium' })}
              />
              <TextField
                label="Fecha de Vencimiento"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...formUtils.createFieldProps({ size: 'large' })}
              />
            </Stack>
          )}
        </Box>
        
        {drawerOpen.content === 'form' && (
          <Box {...overlayUtils.createDrawerFooterProps()}>
            <Stack direction="row" spacing={2}>
              <Button 
                onClick={() => setDrawerOpen({ side: null, content: null })}
                {...formUtils.createButtonProps('secondary', 'medium')}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button 
                {...formUtils.createButtonProps('primary', 'medium')}
                sx={{ flex: 1 }}
              >
                Guardar
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* 🔔 SISTEMA DE SNACKBARS */}
      {snackbars.map((snackbar, index) => {
        const snackbarProps = overlayUtils.createSnackbarProps(snackbar.severity, 'bottomRight');
        return (
          <Snackbar
            key={snackbar.id}
            open={snackbar.open}
            onClose={() => removeSnackbar(snackbar.id)}
            {...snackbarProps.snackbarProps}
            sx={{
              ...snackbarProps.snackbarProps.sx,
              '& .MuiSnackbar-root': {
                bottom: `${(index + 1) * 70}px !important`
              }
            }}
          >
            <Alert
              onClose={() => removeSnackbar(snackbar.id)}
              {...snackbarProps.alertProps}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        );
      })}

      {/* 🎯 Botón de volver arriba (FAB) */}
      <Fab
        color="primary"
        size="medium"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1000
        }}
      >
        <KeyboardArrowUp />
      </Fab>

      {/* Backdrop para estados de carga globales (si fuera necesario) */}
      <Backdrop
        open={false}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

    </Container>
  );
};

export default ModalsUnifiedPage;

/**
 * 📝 GUÍA DE USO - COMENTARIOS
 * 
 * 🎯 CUÁNDO USAR CADA TIPO:
 * 
 * 1. CONFIRMACIÓN:
 *    - Simple: Acciones reversibles (guardar, enviar, actualizar)
 *    - Destructiva: Eliminaciones, cancelaciones, acciones irreversibles
 *    - Transacción: Operaciones financieras, pagos, transferencias
 * 
 * 2. FORMULARIOS:
 *    - Login: Autenticación rápida, recuperación de contraseña
 *    - Negocio: Registro de datos, creación de elementos
 *    - Validación en tiempo real + estados de carga
 * 
 * 3. INFORMATIVOS:
 *    - Compacto: Confirmación rápida de acciones
 *    - Detallado: Errores técnicos, información extensa
 *    - Siempre con icono semántico + colores DS 3.0
 * 
 * 4. DRAWERS:
 *    - Navegación: Menús, filtros, configuración
 *    - Formularios extensos: Más de 5 campos, múltiples secciones
 *    - Detalles: Vista ampliada de elementos
 * 
 * 5. NOTIFICACIONES:
 *    - Snackbars: Feedback inmediato, autoescalables
 *    - Banners: Información persistente, actualizaciones del sistema
 *    - Cola máxima 3 snackbars simultáneos
 * 
 * 🔧 SUGERENCIAS DE TOKENIZACIÓN (TEXTO - NO IMPLEMENTADO):
 * - modalTokens: padding (16,24,32), radius (8,12,16), sombras (level1,2,3)
 * - dialogHeaderTokens: gradientes por semántica, alturas (56,64,72), jerarquías h4/h5/h6
 * - drawerTokens: anchos (300,400,500), backdrop opacity (0.3,0.5), breakpoints
 * - snackbarTokens: duraciones (3000,4000,6000), colores semánticos, queue max (3,5)
 * - confirmTokens: layouts (compact,standard,detailed), estados (safe,warning,destructive)
 */
