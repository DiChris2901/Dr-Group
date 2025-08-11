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
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  Avatar,
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
  Receipt,
  CloudUpload,
  Save,
  Cancel,
  Add,
  Help,
  Security,
  Visibility,
  VisibilityOff,
  Lock,
  Settings,
  Today,
  AccountBalance,
  CreditCard,
  Payment,
  Home
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FormulariosShowcase = ({ gradients, shadows }) => {
  const [activeCategory, setActiveCategory] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para diferentes formularios
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
  const [compromisoData, setCompromisoData] = useState({ 
    nombre: '', empresa: '', monto: '', fecha: '', categoria: '', descripcion: '' 
  });
  const [pagoData, setPagoData] = useState({ 
    compromiso: '', monto: '', fecha: '', metodo: '', comprobante: null 
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
          {/* HEADER DE AUTENTICACIÓN */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: 'primary.main' 
              }}>
                <Login />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Acceso al Sistema
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  DR Group Dashboard • Autenticación segura
                </Typography>
              </Box>
            </Box>
            <Chip 
              label="Seguro" 
              color="success" 
              size="small"
              icon={<Security />}
            />
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
          {/* HEADER DE 2FA CON ESTADO */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'success.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Security />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Verificación Adicional
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  usuario@drgroup.com • Paso 2 de 2
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="2FA Activo" color="success" size="small" />
              <IconButton size="small" sx={{ color: 'success.main' }}>
                <Security fontSize="small" />
              </IconButton>
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

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Security />}
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
          {/* HEADER DE COMPROMISO */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'info.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Assignment />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Nuevo Compromiso Financiero
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registro de obligación empresarial mensual
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Mensual" color="info" size="small" />
              <IconButton size="small" sx={{ color: 'info.main' }}>
                <Help fontSize="small" />
              </IconButton>
            </Box>
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
          {/* HEADER DE EMPRESA */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Registro de Empresa
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Datos básicos empresariales
                </Typography>
              </Box>
            </Box>
            <Chip label="Rápido" color="primary" size="small" variant="outlined" />
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
          {/* HEADER DE PAGO */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'success.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Receipt />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Registrar Pago
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pago de compromiso financiero empresarial
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Pendiente" color="warning" size="small" />
              <IconButton size="small" sx={{ color: 'success.main' }}>
                <Help fontSize="small" />
              </IconButton>
            </Box>
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
          {/* HEADER DE RESUMEN */}
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: 'warning.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 36, height: 36 }}>
                <Receipt />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Resumen de Transacción
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Verificar antes de confirmar
                </Typography>
              </Box>
            </Box>
            <Chip label="Revisar" color="warning" size="small" variant="outlined" />
          </Box>

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
