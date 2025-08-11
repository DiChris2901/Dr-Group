/**
 * 🧾 Design System 3.0 - Formularios Unificados TOKENIZADOS
 * Página consolidada usando tokens DS 3.0 completos
 */
import React, { useState, useRef, useEffect } from 'react';
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
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  Avatar,
  Stack,
  Autocomplete,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  FormHelperText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';

// 🧾 TOKENS DS 3.0 IMPORTADOS
import { 
  formUtils, 
  formatCOP, 
  formatPhone, 
  formatNIT, 
  formatDate, 
  formatMonth 
} from '../theme/tokens/forms.js';
import {
  Login,
  Assignment,
  Business,
  AttachMoney,
  Person,
  Email,
  Phone,
  Receipt,
  CloudUpload,
  Visibility,
  VisibilityOff,
  Security,
  AccountBalance,
  CreditCard,
  Payment,
  Google,
  Microsoft,
  Add,
  Edit,
  Save,
  Cancel,
  Warning,
  CheckCircle,
  Info,
  KeyboardArrowRight
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FormulariosUnificadosSimple = () => {
  const [activeSection, setActiveSection] = useState('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Referencias para scroll spy
  const authRef = useRef(null);
  const businessRef = useRef(null);
  const transactionsRef = useRef(null);

  // Estados de formularios
  const [authData, setAuthData] = useState({
    email: '', password: '', confirmPassword: '', remember: false, company: '', phone: ''
  });
  const [businessData, setBusinessData] = useState({
    companyName: '', nit: '', address: '', phone: '', email: '', contact: '',
    commitmentName: '', amount: '', dueDate: '', category: '', description: '', 
    beneficiary: '', concept: '', frequency: 'monthly'
  });
  const [transactionData, setTransactionData] = useState({
    commitment: '', amount: '', paymentDate: '', method: 'transfer', 
    reference: '', notes: '', file: null
  });

  // ScrollSpy simple
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 200;
      
      if (authRef.current && businessRef.current && transactionsRef.current) {
        const authTop = authRef.current.offsetTop;
        const businessTop = businessRef.current.offsetTop;
        const transactionsTop = transactionsRef.current.offsetTop;
        
        if (scrollY >= transactionsTop) {
          setActiveSection('transactions');
        } else if (scrollY >= businessTop) {
          setActiveSection('business');
        } else {
          setActiveSection('auth');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Utilidades de formato
  const formatCOP = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(number);
  };

  const formatNIT = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 10)}`;
  };

  const formatPhone = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return `+57 ${numbers}`;
    if (numbers.length <= 6) return `+57 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    return `+57 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  };

  // Navegación lateral
  const navigationItems = [
    { id: 'auth', label: 'Autenticación', icon: <Security />, ref: authRef },
    { id: 'business', label: 'Formularios de Negocio', icon: <Business />, ref: businessRef },
    { id: 'transactions', label: 'Transacciones', icon: <Payment />, ref: transactionsRef }
  ];

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        
        {/* ÍNDICE LATERAL STICKY */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ 
            position: 'sticky', 
            top: 24,
            p: 2,
            borderLeft: `4px solid`,
            borderLeftColor: 'info.main'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              📋 Navegación
            </Typography>
            <List>
              {navigationItems.map((item) => (
                <ListItem
                  key={item.id}
                  button
                  onClick={() => scrollToSection(item.ref)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: activeSection === item.id ? 'primary.light' : 'transparent',
                    color: activeSection === item.id ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: activeSection === item.id ? 'primary.main' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                  />
                  {activeSection === item.id && <KeyboardArrowRight />}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* CONTENIDO PRINCIPAL */}
        <Grid item xs={12} md={9}>
          
          {/* SECCIÓN 1: AUTENTICACIÓN - HEADER MANAGEMENT/EXECUTIVE */}
          <Box ref={authRef} id="auth-section" sx={{ mb: 8 }}>
            {/* Header de Sección Consistente */}
            <Box sx={{
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(156, 39, 176, 0.06) 100%)',
              borderRadius: 2,
              p: 4,
              mb: 6,
              border: '1px solid',
              borderColor: 'rgba(25, 118, 210, 0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Security color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h3" sx={{ 
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0
                }}>
                  Autenticación Empresarial
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'text.secondary',
                lineHeight: 1.5
              }}>
                Acceso seguro al sistema de gestión financiera DR Group con autenticación multifactor y sesiones empresariales.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              
              {/* Login DR Group - REDISEÑO COMPLETO DS 3.0 */}
              <Grid item xs={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Paper con Acento DS 3.0 - TOKENIZADO */}
                  <Paper sx={formUtils.getFormPaper('accent', 'primary')}>
                    <Box sx={{ p: { xs: 3, sm: 4 } }}>
                      
                      {/* Header del Formulario */}
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1
                        }}>
                          Iniciar Sesión
                        </Typography>
                        <Typography variant="body2" sx={{
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: 'text.secondary'
                        }}>
                          Accede a tu dashboard empresarial
                        </Typography>
                      </Box>

                      <Stack spacing={3}>
                        
                          {/* Campo Email con Tokens DS 3.0 */}
                          <Box>
                            <TextField
                              label="Email Corporativo"
                              type="email"
                              required
                              value={authData.email}
                              onChange={(e) => setAuthData({...authData, email: e.target.value})}
                              error={authData.email && !authData.email.includes('@')}
                              helperText={
                                authData.email && !authData.email.includes('@') 
                                  ? "Ingresa un email válido" 
                                  : "Utiliza tu email corporativo @drgroup.com"
                              }
                              placeholder="usuario@drgroup.com"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                                    <Email sx={{ 
                                      fontSize: 20, 
                                      color: authData.email && authData.email.includes('@') ? 'success.main' : 'text.secondary' 
                                    }} />
                                  </InputAdornment>
                                )
                              }}
                              {...formUtils.createFieldProps({ 
                                type: 'email', 
                                state: authData.email && !authData.email.includes('@') ? 'error' : 'normal',
                                size: 'large'
                              })}
                            />
                          </Box>

                        {/* Campo Contraseña Mejorado */}
                        <Box>
                          <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={authData.password}
                            onChange={(e) => setAuthData({...authData, password: e.target.value})}
                            placeholder="Ingresa tu contraseña"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                                  <Security sx={{ fontSize: 20, color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <motion.div whileTap={{ scale: 0.95 }}>
                                    <IconButton 
                                      onClick={() => setShowPassword(!showPassword)}
                                      edge="end"
                                      sx={{ 
                                        mr: 0.5,
                                        color: 'text.secondary',
                                        '&:hover': { 
                                          backgroundColor: 'action.hover',
                                          color: 'text.primary'
                                        }
                                      }}
                                    >
                                      {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                    </IconButton>
                                  </motion.div>
                                </InputAdornment>
                              )
                            }}
                            sx={{
                              '& .MuiInputLabel-root': {
                                fontSize: '0.875rem',
                                fontWeight: 500
                              },
                              '& .MuiOutlinedInput-root': {
                                height: 48,
                                borderRadius: '8px',
                                '& fieldset': {
                                  borderWidth: '1.5px',
                                  borderColor: 'grey.300'
                                },
                                '&:hover fieldset': {
                                  borderColor: 'primary.main'
                                },
                                '&.Mui-focused': {
                                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                                },
                                '& input': {
                                  fontSize: '0.875rem',
                                  '&::placeholder': {
                                    color: 'text.disabled',
                                    opacity: 0.7
                                  }
                                }
                              },
                              '& .MuiInputAdornment-root': {
                                '&.MuiInputAdornment-positionStart': {
                                  marginLeft: '12px'
                                }
                              }
                            }}
                          />
                          
                          {/* Barra de Fuerza de Contraseña */}
                          {authData.password && (
                            <Box sx={{ mt: 1, px: 0.5 }}>
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                <Box sx={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: 1,
                                  backgroundColor: authData.password.length >= 8 ? 'success.main' : 'grey.300'
                                }} />
                                <Box sx={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: 1,
                                  backgroundColor: authData.password.length >= 8 && /[A-Z]/.test(authData.password) ? 'success.main' : 'grey.300'
                                }} />
                                <Box sx={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: 1,
                                  backgroundColor: authData.password.length >= 8 && /[A-Z]/.test(authData.password) && /[0-9]/.test(authData.password) ? 'success.main' : 'grey.300'
                                }} />
                              </Box>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.75rem',
                                color: authData.password.length >= 8 && /[A-Z]/.test(authData.password) && /[0-9]/.test(authData.password) 
                                  ? 'success.main' 
                                  : authData.password.length >= 6 
                                    ? 'warning.main' 
                                    : 'error.main'
                              }}>
                                {authData.password.length >= 8 && /[A-Z]/.test(authData.password) && /[0-9]/.test(authData.password)
                                  ? 'Contraseña segura'
                                  : authData.password.length >= 6
                                    ? 'Contraseña media'
                                    : 'Contraseña débil'
                                }
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Enlace "¿Olvidaste tu contraseña?" */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                              variant="text" 
                              size="small"
                              sx={{ 
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: 'primary.main',
                                textTransform: 'none',
                                p: 0.5,
                                minWidth: 'auto',
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText'
                                }
                              }}
                            >
                              ¿Olvidaste tu contraseña?
                            </Button>
                          </Box>
                        </Box>

                        {/* Switch Recordar Sesión */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'text.primary'
                          }}>
                            Recordar mi sesión por 30 días
                          </Typography>
                          <Switch
                            checked={authData.remember}
                            onChange={(e) => setAuthData({...authData, remember: e.target.checked})}
                            color="primary"
                            size="small"
                          />
                        </Box>

                        {/* Botón Primario con Tokens DS 3.0 */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!authData.email || !authData.password || authData.password.length < 6}
                            {...formUtils.createButtonProps('primary', 'large')}
                          >
                            Iniciar Sesión
                          </Button>
                        </motion.div>

                        {/* Separador Sutil */}
                        <Box sx={{ position: 'relative', py: 2 }}>
                          <Divider sx={{ 
                            '&::before, &::after': {
                              borderColor: 'grey.200',
                              borderWidth: '0.5px'
                            }
                          }} />
                          <Typography variant="caption" sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'background.paper',
                            px: 2,
                            fontSize: '0.75rem',
                            color: 'text.disabled'
                          }}>
                            O continuar con
                          </Typography>
                        </Box>

                        {/* Botones SSO Uniformes */}
                        <Stack direction="row" spacing={2}>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ flex: 1 }}
                          >
                            <Button
                              variant="outlined"
                              fullWidth
                              startIcon={<Google sx={{ fontSize: 18 }} />}
                              sx={{
                                height: 48,
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderColor: 'grey.300',
                                color: 'text.primary',
                                transition: 'all 160ms ease',
                                '&:hover': {
                                  borderColor: '#ea4335',
                                  backgroundColor: 'rgba(234, 67, 53, 0.04)',
                                  color: '#ea4335'
                                }
                              }}
                            >
                              Continuar con Google
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ flex: 1 }}
                          >
                            <Button
                              variant="outlined"
                              fullWidth
                              startIcon={<Microsoft sx={{ fontSize: 18 }} />}
                              sx={{
                                height: 48,
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderColor: 'grey.300',
                                color: 'text.primary',
                                transition: 'all 160ms ease',
                                '&:hover': {
                                  borderColor: '#0078d4',
                                  backgroundColor: 'rgba(0, 120, 212, 0.04)',
                                  color: '#0078d4'
                                }
                              }}
                            >
                              Continuar con Microsoft
                            </Button>
                          </motion.div>
                        </Stack>

                        {/* Enlace Crear Cuenta */}
                        <Box sx={{ textAlign: 'center', pt: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            ¿No tienes cuenta?{' '}
                            <Button 
                              variant="text" 
                              size="small"
                              sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'primary.main',
                                textTransform: 'none',
                                p: 0,
                                minWidth: 'auto',
                                verticalAlign: 'baseline',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              Crear cuenta
                            </Button>
                          </Typography>
                        </Box>

                      </Stack>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Registro Empresarial */}
              <Grid item xs={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card sx={{ 
                    borderLeft: `4px solid`,
                    borderLeftColor: 'secondary.main',
                    minHeight: 450,
                    '&:hover': { boxShadow: 3 }
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ backgroundColor: 'secondary.main', width: 48, height: 48 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Registro Empresarial
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Crear nueva cuenta corporativa
                          </Typography>
                        </Box>
                      </Box>

                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="Empresa"
                          required
                          value={authData.company}
                          onChange={(e) => setAuthData({...authData, company: e.target.value})}
                          placeholder="DR Group S.A.S"
                        />

                        <TextField
                          fullWidth
                          label="Email Corporativo"
                          type="email"
                          required
                          value={authData.email}
                          onChange={(e) => setAuthData({...authData, email: e.target.value})}
                          placeholder="admin@drgroup.com"
                          error={authData.email && !authData.email.includes('@')}
                        />

                        <TextField
                          fullWidth
                          label="Teléfono"
                          value={authData.phone}
                          onChange={(e) => setAuthData({...authData, phone: formatPhone(e.target.value)})}
                          placeholder="+57 XXX XXX XXXX"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone color="primary" />
                              </InputAdornment>
                            )
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Contraseña"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={authData.password}
                          onChange={(e) => setAuthData({...authData, password: e.target.value})}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />

                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          sx={{ 
                            py: 1.5,
                            mt: 2,
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #e081e9 0%, #e3455a 100%)',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          Crear Cuenta
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* Recuperar Contraseña */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: 'warning.main',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Warning color="warning" sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Recuperar Contraseña
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ingresa tu email para recibir instrucciones
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="Email registrado"
                          type="email"
                          placeholder="usuario@drgroup.com"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="warning"
                          sx={{ py: 1.75 }}
                        >
                          Enviar Instrucciones
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* SECCIÓN 2: FORMULARIOS DE NEGOCIO */}
          <Box ref={businessRef} id="business-section" sx={{ mb: 8 }}>
            <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" /> 
              2. Formularios de Negocio
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Gestión empresarial con campos dependientes y validaciones específicas.
            </Typography>

            <Grid container spacing={3}>
              
              {/* Crear Empresa */}
              <Grid item xs={12} lg={6}>
                <Card sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: 'info.main',
                  minHeight: 500,
                  '&:hover': { boxShadow: 3 }
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ backgroundColor: 'info.main', width: 48, height: 48 }}>
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Registro de Empresa
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Información corporativa completa
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Nombre de la Empresa"
                        required
                        value={businessData.companyName}
                        onChange={(e) => setBusinessData({...businessData, companyName: e.target.value})}
                        placeholder="DR Group S.A.S"
                        helperText="Razón social completa"
                      />

                      <TextField
                        fullWidth
                        label="NIT"
                        required
                        value={businessData.nit}
                        onChange={(e) => setBusinessData({...businessData, nit: formatNIT(e.target.value)})}
                        placeholder="XXX.XXX.XXX-X"
                        inputProps={{ maxLength: 13 }}
                      />

                      <TextField
                        fullWidth
                        label="Dirección"
                        multiline
                        rows={2}
                        value={businessData.address}
                        onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                        placeholder="Calle, carrera, número, ciudad"
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Teléfono"
                            value={businessData.phone}
                            onChange={(e) => setBusinessData({...businessData, phone: formatPhone(e.target.value)})}
                            placeholder="+57 XXX XXX XXXX"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Empresarial"
                            type="email"
                            value={businessData.email}
                            onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
                            placeholder="info@empresa.com"
                          />
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ 
                          mt: 2,
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #3d9aec 0%, #00d9ec 100%)',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Registrar Empresa
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gestión de Compromisos */}
              <Grid item xs={12} lg={6}>
                <Card sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: 'success.main',
                  minHeight: 500,
                  '&:hover': { boxShadow: 3 }
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ backgroundColor: 'success.main', width: 48, height: 48 }}>
                        <Assignment />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Nuevo Compromiso
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Compromisos financieros mensuales
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Nombre del Compromiso"
                        required
                        value={businessData.commitmentName}
                        onChange={(e) => setBusinessData({...businessData, commitmentName: e.target.value})}
                        placeholder="Arriendo oficina principal"
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Monto"
                            required
                            value={businessData.amount}
                            onChange={(e) => {
                              const formatted = formatCOP(e.target.value);
                              setBusinessData({...businessData, amount: formatted});
                            }}
                            placeholder="$ 0"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoney color="success" />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Fecha de Vencimiento"
                            type="date"
                            required
                            value={businessData.dueDate}
                            onChange={(e) => setBusinessData({...businessData, dueDate: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>

                      <FormControl fullWidth>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={businessData.category}
                          onChange={(e) => setBusinessData({...businessData, category: e.target.value})}
                          label="Categoría"
                        >
                          <MenuItem value="arriendo">Arriendo</MenuItem>
                          <MenuItem value="servicios">Servicios Públicos</MenuItem>
                          <MenuItem value="nomina">Nómina</MenuItem>
                          <MenuItem value="impuestos">Impuestos</MenuItem>
                          <MenuItem value="seguros">Seguros</MenuItem>
                          <MenuItem value="proveedores">Proveedores</MenuItem>
                          <MenuItem value="otros">Otros</MenuItem>
                        </Select>
                      </FormControl>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ 
                          mt: 1,
                          backgroundColor: 'success.main',
                          '&:hover': {
                            backgroundColor: 'success.dark',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Crear Compromiso
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* SECCIÓN 3: TRANSACCIONES */}
          <Box ref={transactionsRef} id="transactions-section" sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payment color="primary" /> 
              3. Transacciones
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Registro de pagos con valores COP y upload de comprobantes.
            </Typography>

            <Grid container spacing={3}>
              
              {/* Registrar Pago */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: 'success.main',
                  minHeight: 400,
                  '&:hover': { boxShadow: 3 }
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ backgroundColor: 'success.main', width: 48, height: 48 }}>
                        <Payment />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Registrar Pago
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Información del pago realizado
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={3}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            options={['Arriendo Oficina Principal', 'Energía Eléctrica', 'Nómina Empleados', 'Seguro Vehículos']}
                            value={transactionData.commitment}
                            onChange={(event, newValue) => setTransactionData({...transactionData, commitment: newValue})}
                            renderInput={(params) => 
                              <TextField {...params} label="Compromiso a Pagar" placeholder="Seleccionar..." required />
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Monto Pagado"
                            required
                            value={transactionData.amount}
                            onChange={(e) => {
                              const formatted = formatCOP(e.target.value);
                              setTransactionData({...transactionData, amount: formatted});
                            }}
                            placeholder="$ 0"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoney color="success" />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Fecha de Pago"
                            type="date"
                            required
                            value={transactionData.paymentDate}
                            onChange={(e) => setTransactionData({...transactionData, paymentDate: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                              value={transactionData.method}
                              onChange={(e) => setTransactionData({...transactionData, method: e.target.value})}
                              label="Método de Pago"
                            >
                              <MenuItem value="transfer">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccountBalance fontSize="small" />
                                  Transferencia Bancaria
                                </Box>
                              </MenuItem>
                              <MenuItem value="card">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CreditCard fontSize="small" />
                                  Tarjeta de Crédito
                                </Box>
                              </MenuItem>
                              <MenuItem value="cash">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AttachMoney fontSize="small" />
                                  Efectivo
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        sx={{ 
                          py: 1.5,
                          backgroundColor: 'success.main',
                          '&:hover': {
                            backgroundColor: 'success.dark',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Registrar Pago
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Upload Comprobantes */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: 'info.main',
                  minHeight: 400,
                  '&:hover': { boxShadow: 3 }
                }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Receipt color="info" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Subir Comprobante
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Adjunta el documento del pago
                    </Typography>

                    <Box sx={{ 
                      border: '2px dashed',
                      borderColor: 'info.light',
                      borderRadius: 2,
                      p: 4,
                      mb: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'info.main',
                        backgroundColor: 'rgba(33, 150, 243, 0.04)'
                      }
                    }}>
                      <CloudUpload color="info" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Arrastra archivos aquí
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        PDF, JPG, PNG (máx. 10MB)
                      </Typography>
                    </Box>

                    <Button variant="outlined" color="info" fullWidth startIcon={<Add />}>
                      Seleccionar Archivo
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

        </Grid>
      </Grid>
    </Container>
  );
};

export default FormulariosUnificadosSimple;
