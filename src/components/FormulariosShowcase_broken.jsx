// FormulariosShowcase.jsx - Design System 3.0 - MODELOS DE FORMULARIOS PROFESIONALES
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
  InputAdornment,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Stack,
  Autocomplete
} from '@mui/material';
import {
  Login,
  Assignment,
  Business,
  AttachMoney,
  CalendarToday,
  Person,
  Email,
  Phone,
  LocationOn,
  Receipt,
  CloudUpload,
  Save,
  Cancel,
  Add,
  Edit,
  Visibility,
  VisibilityOff,
  Lock,
  Security,
  CheckCircle,
  Warning,
  Info,
  Settings,
  Notifications,
  Search,
  FilterList,
  Download,
  Upload,
  Home,
  Dashboard,
  Analytics,
  Today,
  AccountBalance,
  CreditCard,
  Payment
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FormulariosShowcase = ({ gradients, shadows }) => {
  const [activeCategory, setActiveCategory] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados para diferentes formularios
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
  const [compromisoData, setCompromisoData] = useState({ 
    nombre: '', empresa: '', monto: '', fecha: '', categoria: '', descripcion: '' 
  });
  const [pagoData, setPagoData] = useState({ 
    compromiso: '', monto: '', fecha: '', metodo: '', comprobante: null 
  });
  const [multiStepData, setMultiStepData] = useState({
    personal: { nombre: '', email: '', telefono: '' },
    empresa: { nombre: '', nit: '', sector: '' },
    configuracion: { notificaciones: true, reportes: 'mensual', idioma: 'es' }
  });

  const formCategories = [
    { 
      id: 'login', 
      title: '🔐 Autenticación', 
      subtitle: 'Modelos de login y registro',
      icon: <Login />,
      color: 'primary'
    },
    { 
      id: 'business', 
      title: '💼 Formularios de Negocio', 
      subtitle: 'Compromisos, empresas y transacciones',
      icon: <Business />,
      color: 'info'
    },
    { 
      id: 'payments', 
      title: '💳 Transacciones', 
      subtitle: 'Pagos y operaciones financieras',
      icon: <AttachMoney />,
      color: 'success'
    },
    { 
      id: 'multistep', 
      title: '📋 Procesos Complejos', 
      subtitle: 'Formularios multi-paso y configuraciones',
      icon: <Assignment />,
      color: 'warning'
    },
    { 
      id: 'advanced', 
      title: '⚙️ Configuración', 
      subtitle: 'Settings, preferencias y administración',
      icon: <Settings />,
      color: 'error'
    }
  ];

  // MODELO 1: FORMULARIO DE LOGIN PROFESIONAL
  const renderLoginForms = () => (
    <Grid container spacing={3}>
      {/* Login Básico Empresarial */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🔑 Login Empresarial Estándar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Modelo base para autenticación. Diseño sobrio, profesional, 
            con validación en tiempo real y estados de carga. Usado en login principal, 
            modales de re-autenticación y portales administrativos.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              mx: 'auto', 
              mb: 2,
              bgcolor: 'primary.main' 
            }}>
              <Login />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Acceso al Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DR Group Dashboard
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              placeholder="usuario@drgroup.com"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  }
                }
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={loginData.remember}
                  onChange={(e) => setLoginData({...loginData, remember: e.target.checked})}
                  size="small"
                />
              }
              label={<Typography variant="body2">Mantener sesión activa</Typography>}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Login />}
              sx={{
                py: 1.5,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }
              }}
            >
              Iniciar Sesión
            </Button>

            <Divider>
              <Chip label="¿Necesitas ayuda?" size="small" />
            </Divider>

            <Button variant="text" size="small" sx={{ textTransform: 'none' }}>
              Recuperar contraseña
            </Button>
          </Stack>
        </Paper>
      </Grid>

      {/* Login con 2FA */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🔐 Login con Doble Autenticación
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para usuarios administradores y operaciones críticas. 
            Incluye verificación en dos pasos, códigos QR y tokens de seguridad.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
              <Security />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Verificación Adicional
              </Typography>
              <Typography variant="body2" color="text.secondary">
                usuario@drgroup.com
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
            Hemos enviado un código de 6 dígitos a tu dispositivo móvil
          </Alert>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Código de Verificación"
              placeholder="123456"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace'
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Notifications />}
                sx={{ flex: 1 }}
              >
                Reenviar SMS
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Email />}
                sx={{ flex: 1 }}
              >
                Enviar Email
              </Button>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<CheckCircle />}
              sx={{
                py: 1.5,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              Verificar y Continuar
            </Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // MODELO 2: FORMULARIOS DE NEGOCIO
  const renderBusinessForms = () => (
    <Grid container spacing={3}>
      {/* Formulario de Compromiso */}
      <Grid item xs={12} lg={8}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            📋 Crear Compromiso Financiero
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Modelo estándar para entidades principales del sistema. 
            Campos organizados lógicamente, validación en tiempo real, auto-guardado.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Assignment sx={{ color: 'info.main', mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nuevo Compromiso
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Compromiso"
                placeholder="Ej: Arriendo Oficina Principal"
                value={compromisoData.nombre}
                onChange={(e) => setCompromisoData({...compromisoData, nombre: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Assignment color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={compromisoData.empresa}
                  onChange={(e) => setCompromisoData({...compromisoData, empresa: e.target.value})}
                  label="Empresa"
                  startAdornment={
                    <InputAdornment position="start" sx={{ ml: 1 }}>
                      <Business color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="dr-group">DR Group SAS</MenuItem>
                  <MenuItem value="dr-construcciones">DR Construcciones</MenuItem>
                  <MenuItem value="dr-inversiones">DR Inversiones</MenuItem>
                  <MenuItem value="dr-logistica">DR Logística</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={compromisoData.categoria}
                  onChange={(e) => setCompromisoData({...compromisoData, categoria: e.target.value})}
                  label="Categoría"
                >
                  <MenuItem value="arriendo">🏢 Arriendo</MenuItem>
                  <MenuItem value="servicios">⚡ Servicios Públicos</MenuItem>
                  <MenuItem value="nomina">👥 Nómina</MenuItem>
                  <MenuItem value="impuestos">📊 Impuestos</MenuItem>
                  <MenuItem value="proveedores">🚚 Proveedores</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={compromisoData.monto}
                onChange={(e) => setCompromisoData({...compromisoData, monto: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={compromisoData.fecha}
                onChange={(e) => setCompromisoData({...compromisoData, fecha: e.target.value})}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                placeholder="Detalles adicionales del compromiso..."
                multiline
                rows={3}
                value={compromisoData.descripcion}
                onChange={(e) => setCompromisoData({...compromisoData, descripcion: e.target.value})}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                <strong>Recordatorio:</strong> Los compromisos se incluirán automáticamente en los reportes mensuales.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<Cancel />}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Save />}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
                  }}
                >
                  Guardar Compromiso
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Mini-formulario de Empresa */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            🏢 Registro Rápido de Empresa
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para formularios compactos y creación rápida.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Business sx={{ color: 'info.main', mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nueva Empresa
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Nombre de la Empresa"
              placeholder="DR Construcciones SAS"
              size="medium"
            />

            <TextField
              fullWidth
              label="NIT"
              placeholder="900123456-7"
              size="medium"
            />

            <Autocomplete
              options={['Construcción', 'Servicios', 'Comercio', 'Tecnología', 'Consultoría']}
              renderInput={(params) => (
                <TextField {...params} label="Sector" placeholder="Selecciona..." />
              )}
              size="medium"
            />

            <FormControlLabel
              control={<Switch defaultChecked size="small" />}
              label={<Typography variant="body2">Empresa activa</Typography>}
            />

            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              sx={{
                py: 1.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              Crear Empresa
            </Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // MODELO 3: FORMULARIOS DE PAGOS
  const renderPaymentForms = () => (
    <Grid container spacing={3}>
      {/* Registro de Pago */}
      <Grid item xs={12} lg={7}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            💳 Registrar Pago de Compromiso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para transacciones financieras, pagos y operaciones monetarias. 
            Incluye validación de montos, métodos de pago y carga de comprobantes.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Receipt sx={{ color: 'success.main', mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nuevo Pago
            </Typography>
            <Chip 
              label="Pendiente" 
              color="warning" 
              size="small" 
              sx={{ ml: 'auto' }} 
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Compromiso a Pagar</InputLabel>
                <Select
                  value={pagoData.compromiso}
                  onChange={(e) => setPagoData({...pagoData, compromiso: e.target.value})}
                  label="Compromiso a Pagar"
                >
                  <MenuItem value="arriendo-oficina">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Home fontSize="small" />
                      <Box>
                        <Typography variant="body2">Arriendo Oficina Principal</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vence: 15 Ago 2025 • $2,500,000
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="servicios-publicos">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountBalance fontSize="small" />
                      <Box>
                        <Typography variant="body2">Servicios Públicos</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vence: 20 Ago 2025 • $850,000
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto Pagado"
                type="number"
                value={pagoData.monto}
                onChange={(e) => setPagoData({...pagoData, monto: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney color="success" />
                    </InputAdornment>
                  ),
                }}
                helperText="Monto en pesos colombianos"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha del Pago"
                type="date"
                value={pagoData.fecha}
                onChange={(e) => setPagoData({...pagoData, fecha: e.target.value})}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Today color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={pagoData.metodo}
                  onChange={(e) => setPagoData({...pagoData, metodo: e.target.value})}
                  label="Método de Pago"
                  startAdornment={
                    <InputAdornment position="start" sx={{ ml: 1 }}>
                      <CreditCard color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="transferencia">🏦 Transferencia Bancaria</MenuItem>
                  <MenuItem value="cheque">📄 Cheque</MenuItem>
                  <MenuItem value="efectivo">💵 Efectivo</MenuItem>
                  <MenuItem value="pse">🔗 PSE</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ 
                  height: 56, 
                  borderStyle: 'dashed',
                  '&:hover': { borderStyle: 'dashed' }
                }}
              >
                Subir Comprobante
                <input type="file" hidden accept=".pdf,.jpg,.png" />
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="success" sx={{ borderRadius: 1 }}>
                💡 <strong>Tip:</strong> Los pagos se registrarán automáticamente y actualizarán el estado del compromiso.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<Cancel />}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<Payment />}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
                  }}
                >
                  Registrar Pago
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Resumen de Pago */}
      <Grid item xs={12} lg={5}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            📊 Resumen de Transacción
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vista previa del pago antes de confirmar.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Detalles del Pago
          </Typography>

          <Stack spacing={2.5}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                Compromiso
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Arriendo Oficina Principal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                DR Group SAS • Vence: 15 Ago 2025
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Monto Original:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                $2,500,000
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Monto a Pagar:
              </Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                $2,500,000
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Estado Final:
              </Typography>
              <Chip label="Pagado" color="success" size="small" />
            </Box>

            <Divider />

            <Alert severity="info" sx={{ borderRadius: 1 }}>
              Este pago marcará el compromiso como <strong>completado</strong> y se reflejará en los reportes.
            </Alert>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderActiveSection = () => {
    switch (activeCategory) {
      case 'login': return renderLoginForms();
      case 'business': return renderBusinessForms();
      case 'payments': return renderPaymentForms();
      case 'multistep': return renderPaymentForms(); // Por ahora
      case 'advanced': return renderPaymentForms(); // Por ahora
      default: return renderLoginForms();
    }
  };

  return (
    <Grid container spacing={4}>
      {/* Header Principal */}
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          📝 Modelos de Formularios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Biblioteca de plantillas y componentes estándar para formularios del sistema DR Group. 
          Mantiene consistencia visual y funcional en toda la aplicación.
        </Typography>
      </Grid>

      {/* Selector de Categorías */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 2, 
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Grid container spacing={2}>
            {formCategories.map((category) => (
              <Grid item xs={12} sm={6} lg key={category.id}>
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant={activeCategory === category.id ? 'contained' : 'outlined'}
                    startIcon={category.icon}
                    onClick={() => setActiveCategory(category.id)}
                    sx={{
                      p: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      height: 'auto',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 0.5,
                      ...(activeCategory === category.id ? {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      } : {})
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      {category.icon}
                      <Typography variant="subtitle2" fontWeight={500}>
                        {category.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
                      {category.subtitle}
                    </Typography>
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Contenido Activo */}
      <Grid item xs={12}>
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveSection()}
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default FormulariosShowcase;

  // Formulario de Compromiso Financiero
  const renderCompromisoForm = () => (
    <Card sx={{ 
      maxWidth: 700, 
      mx: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardHeader
        title="Agregar Nuevo Compromiso Financiero"
        subheader="Registra un compromiso de pago para el grupo empresarial"
        avatar={
          <Assignment sx={{ color: 'primary.main', fontSize: 24 }} />
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Compromiso"
              placeholder="Ej: Arriendo Oficina Principal"
              value={compromisoForm.nombre}
              onChange={(e) => setCompromisoForm({...compromisoForm, nombre: e.target.value})}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Assignment color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={compromisoForm.empresa}
                onChange={(e) => setCompromisoForm({...compromisoForm, empresa: e.target.value})}
                label="Empresa"
              >
                <MenuItem value="dr-group">DR Group SAS</MenuItem>
                <MenuItem value="dr-construcciones">DR Construcciones Ltda.</MenuItem>
                <MenuItem value="dr-inversiones">DR Inversiones S.A.</MenuItem>
                <MenuItem value="dr-logistica">DR Logística y Servicios</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={compromisoForm.categoria}
                onChange={(e) => setCompromisoForm({...compromisoForm, categoria: e.target.value})}
                label="Categoría"
              >
                <MenuItem value="arriendo">Arriendo</MenuItem>
                <MenuItem value="servicios">Servicios Públicos</MenuItem>
                <MenuItem value="nomina">Nómina</MenuItem>
                <MenuItem value="impuestos">Impuestos</MenuItem>
                <MenuItem value="prestamos">Préstamos</MenuItem>
                <MenuItem value="proveedores">Proveedores</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              placeholder="0"
              value={compromisoForm.monto}
              onChange={(e) => setCompromisoForm({...compromisoForm, monto: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Vencimiento"
              type="date"
              value={compromisoForm.fechaVencimiento}
              onChange={(e) => setCompromisoForm({...compromisoForm, fechaVencimiento: e.target.value})}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              placeholder="Detalles adicionales del compromiso..."
              value={compromisoForm.descripcion}
              onChange={(e) => setCompromisoForm({...compromisoForm, descripcion: e.target.value})}
              variant="outlined"
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={compromisoForm.esRecurrente}
                  onChange={(e) => setCompromisoForm({...compromisoForm, esRecurrente: e.target.checked})}
                  color="primary"
                />
              }
              label="Compromiso recurrente (mensual)"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setCompromisoForm({
                  nombre: '', empresa: '', monto: '', fechaVencimiento: '', 
                  descripcion: '', categoria: '', esRecurrente: false
                })}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                sx={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }
                }}
              >
                Guardar Compromiso
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Formulario de Registro de Pago
  const renderPagoForm = () => (
    <Card sx={{ 
      maxWidth: 700, 
      mx: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardHeader
        title="Registrar Pago"
        subheader="Registra el pago de un compromiso financiero"
        avatar={
          <Receipt sx={{ color: 'success.main', fontSize: 24 }} />
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Compromiso a Pagar</InputLabel>
              <Select
                value={pagoForm.compromiso}
                onChange={(e) => setPagoForm({...pagoForm, compromiso: e.target.value})}
                label="Compromiso a Pagar"
              >
                <MenuItem value="arriendo-oficina">Arriendo Oficina Principal - $2,500,000</MenuItem>
                <MenuItem value="nomina-enero">Nómina Enero 2025 - $15,000,000</MenuItem>
                <MenuItem value="servicios-publicos">Servicios Públicos - $850,000</MenuItem>
                <MenuItem value="impuesto-renta">Impuesto de Renta - $5,200,000</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monto Pagado"
              type="number"
              placeholder="0"
              value={pagoForm.montoPagado}
              onChange={(e) => setPagoForm({...pagoForm, montoPagado: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Pago"
              type="date"
              value={pagoForm.fechaPago}
              onChange={(e) => setPagoForm({...pagoForm, fechaPago: e.target.value})}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={pagoForm.metodoPago}
                onChange={(e) => setPagoForm({...pagoForm, metodoPago: e.target.value})}
                label="Método de Pago"
              >
                <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="tarjeta">Tarjeta de Crédito</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Comprobante de Pago
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ justifyContent: 'flex-start' }}
              >
                Subir Archivo
                <input type="file" hidden />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              placeholder="Notas adicionales sobre el pago..."
              value={pagoForm.observaciones}
              onChange={(e) => setPagoForm({...pagoForm, observaciones: e.target.value})}
              variant="outlined"
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              El pago será registrado y el estado del compromiso se actualizará automáticamente.
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setPagoForm({
                  compromiso: '', montoPagado: '', fechaPago: '', 
                  metodoPago: '', comprobante: null, observaciones: ''
                })}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                sx={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }
                }}
              >
                Registrar Pago
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Formulario de Nueva Empresa
  const renderEmpresaForm = () => (
    <Card sx={{ 
      maxWidth: 700, 
      mx: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardHeader
        title="Agregar Nueva Empresa"
        subheader="Registra una nueva empresa del grupo DR"
        avatar={
          <Business sx={{ color: 'info.main', fontSize: 24 }} />
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre de la Empresa"
              placeholder="Ej: DR Construcciones Ltda."
              value={empresaForm.nombre}
              onChange={(e) => setEmpresaForm({...empresaForm, nombre: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="NIT"
              placeholder="900123456-7"
              value={empresaForm.nit}
              onChange={(e) => setEmpresaForm({...empresaForm, nit: e.target.value})}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Representante Legal"
              placeholder="Nombre completo"
              value={empresaForm.representante}
              onChange={(e) => setEmpresaForm({...empresaForm, representante: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              placeholder="+57 300 123 4567"
              value={empresaForm.telefono}
              onChange={(e) => setEmpresaForm({...empresaForm, telefono: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Corporativo"
              placeholder="contacto@drgrupo.com"
              value={empresaForm.email}
              onChange={(e) => setEmpresaForm({...empresaForm, email: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ciudad"
              placeholder="Bogotá D.C."
              value={empresaForm.ciudad}
              onChange={(e) => setEmpresaForm({...empresaForm, ciudad: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              placeholder="Calle 123 # 45-67, Local 8"
              value={empresaForm.direccion}
              onChange={(e) => setEmpresaForm({...empresaForm, direccion: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={empresaForm.activa}
                  onChange={(e) => setEmpresaForm({...empresaForm, activa: e.target.checked})}
                  color="primary"
                />
              }
              label="Empresa activa"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setEmpresaForm({
                  nombre: '', nit: '', representante: '', telefono: '', 
                  email: '', direccion: '', ciudad: '', activa: true
                })}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<Save />}
                sx={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }
                }}
              >
                Crear Empresa
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Formulario de Nuevo Usuario
  const renderUsuarioForm = () => (
    <Card sx={{ 
      maxWidth: 700, 
      mx: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardHeader
        title="Agregar Nuevo Usuario"
        subheader="Registra un usuario para acceso al sistema"
        avatar={
          <Person sx={{ color: 'warning.main', fontSize: 24 }} />
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Completo"
              placeholder="Juan Pérez García"
              value={usuarioForm.nombre}
              onChange={(e) => setUsuarioForm({...usuarioForm, nombre: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              placeholder="juan.perez@drgrupo.com"
              value={usuarioForm.email}
              onChange={(e) => setUsuarioForm({...usuarioForm, email: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              placeholder="+57 300 123 4567"
              value={usuarioForm.telefono}
              onChange={(e) => setUsuarioForm({...usuarioForm, telefono: e.target.value})}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Empresa Asignada</InputLabel>
              <Select
                value={usuarioForm.empresa}
                onChange={(e) => setUsuarioForm({...usuarioForm, empresa: e.target.value})}
                label="Empresa Asignada"
              >
                <MenuItem value="todas">Todas las Empresas</MenuItem>
                <MenuItem value="dr-group">DR Group SAS</MenuItem>
                <MenuItem value="dr-construcciones">DR Construcciones Ltda.</MenuItem>
                <MenuItem value="dr-inversiones">DR Inversiones S.A.</MenuItem>
                <MenuItem value="dr-logistica">DR Logística y Servicios</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Rol de Usuario</InputLabel>
              <Select
                value={usuarioForm.rol}
                onChange={(e) => setUsuarioForm({...usuarioForm, rol: e.target.value})}
                label="Rol de Usuario"
              >
                <MenuItem value="administrador">Administrador</MenuItem>
                <MenuItem value="gerente">Gerente</MenuItem>
                <MenuItem value="contador">Contador</MenuItem>
                <MenuItem value="asistente">Asistente</MenuItem>
                <MenuItem value="consultor">Solo Consulta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={usuarioForm.password}
              onChange={(e) => setUsuarioForm({...usuarioForm, password: e.target.value})}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              El usuario recibirá un email con las credenciales de acceso una vez creada la cuenta.
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setUsuarioForm({
                  nombre: '', email: '', telefono: '', empresa: '', 
                  rol: '', password: '', confirmarPassword: ''
                })}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Save />}
                sx={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }
                }}
              >
                Crear Usuario
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderActiveForm = () => {
    switch (activeForm) {
      case 'compromiso': return renderCompromisoForm();
      case 'pago': return renderPagoForm();
      case 'empresa': return renderEmpresaForm();
      case 'usuario': return renderUsuarioForm();
      default: return renderCompromisoForm();
    }
  };

  return (
    <Grid container spacing={4}>
      {/* Header */}
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          📋 Formularios Empresariales
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Formularios específicos para la gestión financiera y administrativa del Grupo DR
        </Typography>
      </Grid>

      {/* Selector de Formularios */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 2, 
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Grid container spacing={2}>
            {formCategories.map((category) => (
              <Grid item xs={12} sm={6} md={3} key={category.id}>
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant={activeForm === category.id ? 'contained' : 'outlined'}
                    startIcon={category.icon}
                    onClick={() => setActiveForm(category.id)}
                    sx={{
                      p: 1.5,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      height: 'auto',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 0.5,
                      ...(activeForm === category.id ? {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      } : {})
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      {category.icon}
                      <Typography variant="subtitle2" fontWeight={500}>
                        {category.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
                      {category.description}
                    </Typography>
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Formulario Activo */}
      <Grid item xs={12}>
        <motion.div
          key={activeForm}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveSection()}
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default FormulariosShowcase;
