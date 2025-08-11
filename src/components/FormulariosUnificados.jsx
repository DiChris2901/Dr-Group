/**
 * 📋 Design System 3.0 - Formularios Unificados  
 * Página consolidada de todos los formularios usando tokens existentes
 * RESTRICCIÓN: Solo sx locales, sin modificar tokens
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

// Importar tokens existentes (sin modificarlos)
import { designTokens, tokenUtils } from '../theme/tokens';

const FormulariosUnificados = () => {
  const [activeSection, setActiveSection] = useState('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Referencias para scroll spy
  const authRef = useRef(null);
  const businessRef = useRef(null);
  const transactionsRef = useRef(null);

  // Estados de formularios (temporal)
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

  // ScrollSpy simple (detectar sección activa)
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

  // Utilidades de formato (máscaras visuales simples)
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

  // Componente de campo con estados
  const FormField = ({ 
    error = false, 
    success = false, 
    loading = false, 
    required = false,
    helperText = '',
    children 
  }) => {
    const getFieldStyles = () => {
      if (error) return {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: designTokens.colors.error.main },
          '&:hover fieldset': { borderColor: designTokens.colors.error.dark },
        }
      };
      if (success) return {
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: designTokens.colors.success.main },
          '&:hover fieldset': { borderColor: designTokens.colors.success.dark },
        }
      };
      return {};
    };

    return (
      <Box sx={{ mb: 2, ...getFieldStyles() }}>
        {React.cloneElement(children, { 
          error: error,
          required: required,
          disabled: loading 
        })}
        {helperText && (
          <FormHelperText error={error} sx={{ color: success ? 'success.main' : undefined }}>
            {helperText}
          </FormHelperText>
        )}
      </Box>
    );
  };

  // Navegación lateral (sticky)
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
            <Box sx={{ 
              position: 'sticky', 
              top: 24, 
              ...tokenUtils.cards.createPaperAccent('info', 'medium').sx
            }}>
              <Typography variant="h6" sx={{ 
                p: 2, 
                ...designTokens.muiVariants.h6,
                borderBottom: `1px solid ${designTokens.colors.grey[200]}`
              }}>
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
                      mx: 1,
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
            </Box>
          </Grid>

          {/* CONTENIDO PRINCIPAL */}
          <Grid item xs={12} md={9}>
            
            {/* SECCIÓN 1: AUTENTICACIÓN */}
            <Box ref={authRef} id="auth-section" sx={{ mb: 8 }}>
              <Typography variant="h4" sx={{ 
                ...designTokens.muiVariants.h4,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Security color="primary" /> 
                1. Autenticación
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Formularios de login, registro y recuperación de contraseña con validaciones y estados visuales.
              </Typography>

              <Grid container spacing={3}>
                
                {/* Login DR Group */}
                <Grid item xs={12} lg={6}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('primary', 'large').sx,
                      minHeight: 500
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ 
                            backgroundColor: 'primary.main', 
                            width: 48, 
                            height: 48 
                          }}>
                            <Login />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Login Empresarial
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Acceso seguro al dashboard
                            </Typography>
                          </Box>
                        </Box>

                        <Stack spacing={2}>
                          <FormField required helperText="Ingresa tu email corporativo">
                            <TextField
                              fullWidth
                              label="Email Corporativo"
                              type="email"
                              value={authData.email}
                              onChange={(e) => setAuthData({...authData, email: e.target.value})}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Email color="primary" />
                                  </InputAdornment>
                                )
                              }}
                              placeholder="usuario@drgroup.com"
                            />
                          </FormField>

                          <FormField required>
                            <TextField
                              fullWidth
                              label="Contraseña"
                              type={showPassword ? 'text' : 'password'}
                              value={authData.password}
                              onChange={(e) => setAuthData({...authData, password: e.target.value})}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Security color="primary" />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                      {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }}
                            />
                          </FormField>

                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={authData.remember}
                                onChange={(e) => setAuthData({...authData, remember: e.target.checked})}
                                color="primary"
                              />
                            }
                            label="Recordar sesión por 30 días"
                          />

                          <Button
                            fullWidth
                            size="large"
                            sx={{ 
                              ...tokenUtils.buttons.createButtonProps({
                                gradient: 'primary',
                                size: 'large',
                                animation: 'gradient'
                              }).sx,
                              py: 1.5,
                              mt: 2
                            }}
                          >
                            Iniciar Sesión
                          </Button>

                          <Divider sx={{ my: 2 }}>
                            <Chip label="O continuar con" size="small" />
                          </Divider>

                          <Stack direction="row" spacing={1}>
                            <Button 
                              variant="outlined" 
                              startIcon={<Google />} 
                              fullWidth
                              size="small"
                            >
                              Google
                            </Button>
                            <Button 
                              variant="outlined" 
                              startIcon={<Microsoft />} 
                              fullWidth
                              size="small"
                            >
                              Microsoft
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
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
                      ...tokenUtils.cards.createPaperAccent('secondary', 'large').sx,
                      minHeight: 500
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ 
                            backgroundColor: 'secondary.main', 
                            width: 48, 
                            height: 48 
                          }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Registro Empresarial
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Crear nueva cuenta corporativa
                            </Typography>
                          </Box>
                        </Box>

                        <Stack spacing={2}>
                          <FormField required>
                            <TextField
                              fullWidth
                              label="Empresa"
                              value={authData.company}
                              onChange={(e) => setAuthData({...authData, company: e.target.value})}
                              placeholder="DR Group S.A.S"
                            />
                          </FormField>

                          <FormField required error={authData.email && !authData.email.includes('@')}>
                            <TextField
                              fullWidth
                              label="Email Corporativo"
                              type="email"
                              value={authData.email}
                              onChange={(e) => setAuthData({...authData, email: e.target.value})}
                              placeholder="admin@drgroup.com"
                            />
                          </FormField>

                          <FormField>
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
                          </FormField>

                          <FormField required>
                            <TextField
                              fullWidth
                              label="Contraseña"
                              type={showPassword ? 'text' : 'password'}
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
                          </FormField>

                          <FormField required>
                            <TextField
                              fullWidth
                              label="Confirmar Contraseña"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={authData.confirmPassword}
                              onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                              error={authData.confirmPassword && authData.password !== authData.confirmPassword}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }}
                            />
                          </FormField>

                          <Button
                            fullWidth
                            size="large"
                            sx={{ 
                              ...tokenUtils.buttons.createButtonProps({
                                gradient: 'secondary',
                                size: 'large',
                                animation: 'gradient'
                              }).sx,
                              py: 1.5,
                              mt: 2
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('warning', 'medium').sx
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Warning color="warning" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
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
                  </motion.div>
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 2: FORMULARIOS DE NEGOCIO */}
            <Box ref={businessRef} id="business-section" sx={{ mb: 8 }}>
              <Typography variant="h4" sx={{ 
                ...designTokens.muiVariants.h4,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Business color="primary" /> 
                2. Formularios de Negocio
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Gestión de empresas, compromisos financieros, beneficiarios y conceptos con campos dependientes.
              </Typography>

              <Grid container spacing={3}>
                
                {/* Crear Empresa */}
                <Grid item xs={12} lg={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('info', 'large').sx,
                      minHeight: 520
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ backgroundColor: 'info.main', width: 48, height: 48 }}>
                            <Business />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Registro de Empresa
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Información corporativa completa
                            </Typography>
                          </Box>
                        </Box>

                        <Stack spacing={2}>
                          <FormField required helperText="Razón social completa">
                            <TextField
                              fullWidth
                              label="Nombre de la Empresa"
                              value={businessData.companyName}
                              onChange={(e) => setBusinessData({...businessData, companyName: e.target.value})}
                              placeholder="DR Group S.A.S"
                            />
                          </FormField>

                          <FormField required>
                            <TextField
                              fullWidth
                              label="NIT"
                              value={businessData.nit}
                              onChange={(e) => setBusinessData({...businessData, nit: formatNIT(e.target.value)})}
                              placeholder="XXX.XXX.XXX-X"
                              inputProps={{ maxLength: 13 }}
                            />
                          </FormField>

                          <FormField>
                            <TextField
                              fullWidth
                              label="Dirección"
                              multiline
                              rows={2}
                              value={businessData.address}
                              onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                              placeholder="Calle, carrera, número, ciudad"
                            />
                          </FormField>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormField>
                                <TextField
                                  fullWidth
                                  label="Teléfono"
                                  value={businessData.phone}
                                  onChange={(e) => setBusinessData({...businessData, phone: formatPhone(e.target.value)})}
                                  placeholder="+57 XXX XXX XXXX"
                                />
                              </FormField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormField>
                                <TextField
                                  fullWidth
                                  label="Email Empresarial"
                                  type="email"
                                  value={businessData.email}
                                  onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
                                  placeholder="info@empresa.com"
                                />
                              </FormField>
                            </Grid>
                          </Grid>

                          <FormField>
                            <TextField
                              fullWidth
                              label="Persona de Contacto"
                              value={businessData.contact}
                              onChange={(e) => setBusinessData({...businessData, contact: e.target.value})}
                              placeholder="Nombre del responsable"
                            />
                          </FormField>

                          <Button
                            fullWidth
                            size="large"
                            sx={{ 
                              ...tokenUtils.buttons.createButtonProps({
                                gradient: 'info',
                                size: 'large',
                                animation: 'gradient'
                              }).sx,
                              mt: 2
                            }}
                          >
                            Registrar Empresa
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Gestión de Compromisos */}
                <Grid item xs={12} lg={6}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('success', 'large').sx,
                      minHeight: 520
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ backgroundColor: 'success.main', width: 48, height: 48 }}>
                            <Assignment />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Nuevo Compromiso
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Compromisos financieros mensuales
                            </Typography>
                          </Box>
                        </Box>

                        <Stack spacing={2}>
                          <FormField required>
                            <TextField
                              fullWidth
                              label="Nombre del Compromiso"
                              value={businessData.commitmentName}
                              onChange={(e) => setBusinessData({...businessData, commitmentName: e.target.value})}
                              placeholder="Arriendo oficina principal"
                            />
                          </FormField>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormField required>
                                <TextField
                                  fullWidth
                                  label="Monto"
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
                              </FormField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormField required>
                                <TextField
                                  fullWidth
                                  label="Fecha de Vencimiento"
                                  type="date"
                                  value={businessData.dueDate || ''}
                                  onChange={(e) => setBusinessData({...businessData, dueDate: e.target.value})}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </FormField>
                            </Grid>
                          </Grid>

                          <FormField>
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
                          </FormField>

                          <FormField>
                            <FormControl component="fieldset">
                              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Periodicidad
                              </Typography>
                              <RadioGroup
                                value={businessData.frequency}
                                onChange={(e) => setBusinessData({...businessData, frequency: e.target.value})}
                                row
                              >
                                <FormControlLabel value="monthly" control={<Radio />} label="Mensual" />
                                <FormControlLabel value="bimonthly" control={<Radio />} label="Bimensual" />
                                <FormControlLabel value="quarterly" control={<Radio />} label="Trimestral" />
                              </RadioGroup>
                            </FormControl>
                          </FormField>

                          <FormField>
                            <TextField
                              fullWidth
                              label="Descripción"
                              multiline
                              rows={2}
                              value={businessData.description}
                              onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
                              placeholder="Detalles adicionales del compromiso"
                            />
                          </FormField>

                          <Button
                            fullWidth
                            size="large"
                            sx={{ 
                              ...tokenUtils.buttons.createButtonProps({
                                gradient: 'success',
                                size: 'large',
                                animation: 'gradient'
                              }).sx,
                              mt: 1
                            }}
                          >
                            Crear Compromiso
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Beneficiarios y Conceptos */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('primary', 'medium').sx
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Person color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Beneficiarios y Conceptos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Configuración de pagos con selects dependientes
                            </Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <FormField>
                              <Autocomplete
                                options={['Propietario Inmueble', 'Empresa Servicios', 'Entidad Financiera', 'Proveedor', 'Empleado']}
                                value={businessData.beneficiary}
                                onChange={(event, newValue) => setBusinessData({...businessData, beneficiary: newValue})}
                                renderInput={(params) => 
                                  <TextField {...params} label="Beneficiario" placeholder="Seleccionar..." />
                                }
                              />
                            </FormField>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormField>
                              <FormControl fullWidth>
                                <InputLabel>Concepto</InputLabel>
                                <Select
                                  value={businessData.concept}
                                  onChange={(e) => setBusinessData({...businessData, concept: e.target.value})}
                                  label="Concepto"
                                  disabled={!businessData.beneficiary}
                                >
                                  {businessData.beneficiary === 'Propietario Inmueble' && [
                                    <MenuItem key="arriendo" value="arriendo">Arriendo</MenuItem>,
                                    <MenuItem key="administracion" value="administracion">Administración</MenuItem>
                                  ]}
                                  {businessData.beneficiary === 'Empresa Servicios' && [
                                    <MenuItem key="energia" value="energia">Energía</MenuItem>,
                                    <MenuItem key="agua" value="agua">Agua</MenuItem>,
                                    <MenuItem key="gas" value="gas">Gas</MenuItem>,
                                    <MenuItem key="internet" value="internet">Internet</MenuItem>
                                  ]}
                                  {businessData.beneficiary === 'Entidad Financiera' && [
                                    <MenuItem key="credito" value="credito">Crédito</MenuItem>,
                                    <MenuItem key="tarjeta" value="tarjeta">Tarjeta de Crédito</MenuItem>
                                  ]}
                                </Select>
                              </FormControl>
                            </FormField>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Alert 
                              severity={businessData.beneficiary && businessData.concept ? "success" : "info"}
                              sx={{ height: 56, display: 'flex', alignItems: 'center' }}
                            >
                              {businessData.beneficiary && businessData.concept 
                                ? "Configuración completa" 
                                : "Selecciona beneficiario primero"
                              }
                            </Alert>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 3: TRANSACCIONES */}
            <Box ref={transactionsRef} id="transactions-section" sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ 
                ...designTokens.muiVariants.h4,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Payment color="primary" /> 
                3. Transacciones
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Registro de pagos, upload de comprobantes y manejo de valores en pesos colombianos.
              </Typography>

              <Grid container spacing={3}>
                
                {/* Registrar Pago */}
                <Grid item xs={12} lg={8}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('success', 'large').sx,
                      minHeight: 450
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ backgroundColor: 'success.main', width: 48, height: 48 }}>
                            <Payment />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
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
                              <FormField required>
                                <Autocomplete
                                  options={['Arriendo Oficina Principal', 'Energía Eléctrica', 'Nómina Empleados', 'Seguro Vehículos']}
                                  value={transactionData.commitment}
                                  onChange={(event, newValue) => setTransactionData({...transactionData, commitment: newValue})}
                                  renderInput={(params) => 
                                    <TextField {...params} label="Compromiso a Pagar" placeholder="Seleccionar..." />
                                  }
                                />
                              </FormField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormField required>
                                <TextField
                                  fullWidth
                                  label="Monto Pagado"
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
                              </FormField>
                            </Grid>
                          </Grid>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormField required>
                                <TextField
                                  fullWidth
                                  label="Fecha de Pago"
                                  type="date"
                                  value={transactionData.paymentDate || ''}
                                  onChange={(e) => setTransactionData({...transactionData, paymentDate: e.target.value})}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </FormField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormField required>
                                <FormControl fullWidth>
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
                              </FormField>
                            </Grid>
                          </Grid>

                          <FormField>
                            <TextField
                              fullWidth
                              label="Número de Referencia"
                              value={transactionData.reference}
                              onChange={(e) => setTransactionData({...transactionData, reference: e.target.value})}
                              placeholder="Número de transacción o cheque"
                            />
                          </FormField>

                          <FormField>
                            <TextField
                              fullWidth
                              label="Notas Adicionales"
                              multiline
                              rows={2}
                              value={transactionData.notes}
                              onChange={(e) => setTransactionData({...transactionData, notes: e.target.value})}
                              placeholder="Observaciones del pago"
                            />
                          </FormField>

                          <Button
                            fullWidth
                            size="large"
                            sx={{ 
                              ...tokenUtils.buttons.createButtonProps({
                                gradient: 'success',
                                size: 'large',
                                animation: 'gradient'
                              }).sx,
                              py: 1.5
                            }}
                            startIcon={<Save />}
                          >
                            Registrar Pago
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Upload Comprobantes */}
                <Grid item xs={12} lg={4}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('info', 'large').sx,
                      minHeight: 450
                    }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Box sx={{ mb: 3 }}>
                          <Receipt color="info" sx={{ fontSize: 48, mb: 1 }} />
                          <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6, mb: 1 }}>
                            Subir Comprobante
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Adjunta el documento del pago
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          border: '2px dashed',
                          borderColor: 'info.light',
                          borderRadius: 2,
                          p: 4,
                          mb: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
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

                        <Button 
                          variant="outlined" 
                          color="info" 
                          fullWidth 
                          sx={{ mb: 2 }}
                          startIcon={<Add />}
                        >
                          Seleccionar Archivo
                        </Button>

                        <Divider sx={{ my: 2 }}>
                          <Chip label="Estados" size="small" />
                        </Divider>

                        <Stack spacing={1}>
                          <Chip 
                            label="✅ Archivo válido" 
                            color="success" 
                            size="small" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="⚠️ Archivo muy grande" 
                            color="warning" 
                            size="small" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="❌ Formato no válido" 
                            color="error" 
                            size="small" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Chip 
                            label="📄 Cargando..." 
                            color="info" 
                            size="small" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Resumen COP */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card sx={{ 
                      ...tokenUtils.cards.createPaperAccent('primary', 'medium').sx
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <AttachMoney color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="h6" sx={{ ...designTokens.muiVariants.h6 }}>
                              Valores COP con Máscara Visual
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Formateo automático de moneda colombiana
                            </Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={3}>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              label="Monto Base"
                              placeholder="$ 1.500.000"
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              label="Con IVA (19%)"
                              placeholder="$ 1.785.000"
                              size="small"
                              disabled
                              value="$ 1.785.000"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              label="Descuento"
                              placeholder="$ 50.000"
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">-$</InputAdornment>
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              height: 40,
                              px: 2,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Total: $ 1.735.000
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>

          </Grid>
        </Grid>
      </Container>
    );
  };

export default FormulariosUnificados;
