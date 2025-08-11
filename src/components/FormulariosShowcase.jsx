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
  ArrowForward,
  Google,
  Microsoft,
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
      {/* Login DR Group - Inspirado en el login actual */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🎯 DR Group Login Actual
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Inspirado en tu login:</strong> Efectos spectaculares, glassmorphism, gradientes 
            y animaciones. Design System 3.0 aplicado con identidad corporativa DR Group 
            manteniendo el estilo profesional empresarial.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 0,
          border: `1px solid rgba(25, 118, 210, 0.15)`,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
          backdropFilter: 'blur(40px)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(25, 118, 210, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
            zIndex: 2
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 15% 15%, rgba(25, 118, 210, 0.04) 0%, transparent 40%),
              radial-gradient(circle at 85% 85%, rgba(21, 101, 192, 0.03) 0%, transparent 40%)
            `,
            animation: 'floatGlow 12s ease-in-out infinite',
            pointerEvents: 'none',
            '@keyframes floatGlow': {
              '0%, 100%': { 
                transform: 'translateY(0) scale(1)',
                opacity: 0.6 
              },
              '33%': { 
                transform: 'translateY(-2px) scale(1.02)',
                opacity: 0.8 
              },
              '66%': { 
                transform: 'translateY(1px) scale(0.98)',
                opacity: 0.7 
              }
            }
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `
              0 16px 48px rgba(0, 0, 0, 0.15),
              0 8px 24px rgba(25, 118, 210, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `
          },
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {/* Header DR Group con efectos spectacular */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px 12px 0 0',
            p: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(25, 118, 210, 0.02) 50%, transparent 70%)',
              animation: 'shimmer 6s infinite',
              pointerEvents: 'none',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }
          }}>
            
            {/* Avatar Icon DR Group */}
            <Box sx={{
              background: 'linear-gradient(135deg, #1976d2, #1565c0)',
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              boxShadow: `
                0 6px 20px rgba(25, 118, 210, 0.35),
                0 3px 10px rgba(25, 118, 210, 0.25),
                inset 0 1px 0 rgba(255,255,255,0.3)
              `,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                animation: 'shimmer 4s infinite'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                borderRadius: '10px',
                zIndex: -1,
                opacity: 0.3,
                filter: 'blur(4px)'
              },
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `
                  0 8px 25px rgba(25, 118, 210, 0.45),
                  0 4px 12px rgba(25, 118, 210, 0.30),
                  inset 0 1px 0 rgba(255,255,255,0.4)
                `
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <Business sx={{ 
                fontSize: 32, 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
            </Box>

            {/* Títulos DR Group con gradiente */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 0.5,
                fontSize: '1.8rem',
                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}>
                DR Group
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Dashboard Empresarial • Acceso Seguro
              </Typography>
            </Box>

            {/* Badge Premium */}
            <Chip 
              label="Enterprise" 
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
              icon={<Security sx={{ fontSize: '1rem' }} />}
            />
          </Box>

          {/* Formulario Principal DR Group */}
          <Box sx={{ p: 4 }}>
            <Stack spacing={3}>
              
              {/* Campo Email con efectos spectacular */}
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Correo Electrónico Corporativo
                </Typography>
                <TextField
                  fullWidth
                  placeholder="usuario@drgroup.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 0.95)',
                        borderColor: 'primary.light',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                        transform: 'translateY(-1px)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>

              {/* Campo Password con efectos spectacular */}
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Contraseña Segura
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setShowPassword(!showPassword)} 
                          edge="end"
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'primary.main',
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 0.95)',
                        borderColor: 'primary.light',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                        transform: 'translateY(-1px)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>

              {/* Opciones adicionales */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={loginData.remember}
                      onChange={(e) => setLoginData({...loginData, remember: e.target.checked})}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'primary.main',
                          '& + .MuiSwitch-track': {
                            backgroundColor: 'primary.main',
                            opacity: 0.6
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      Mantener sesión activa
                    </Typography>
                  }
                />
                <Button 
                  variant="text" 
                  size="small" 
                  sx={{ 
                    color: 'primary.main', 
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      textDecoration: 'underline',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </Box>

              {/* Botón Principal DR Group */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  mt: 2,
                  py: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.35)',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.45)',
                    transform: 'translateY(-3px)'
                  },
                  '&:active': {
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.6s'
                  },
                  '&:hover::before': {
                    left: '100%'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Acceder al Dashboard
              </Button>

              <Divider sx={{ 
                my: 2,
                '&::before, &::after': {
                  borderColor: 'rgba(0,0,0,0.08)'
                }
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  px: 2
                }}>
                  o continúa con
                </Typography>
              </Divider>

              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: 'rgba(0,0,0,0.12)',
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(66, 133, 244, 0.04)',
                      borderColor: '#4285f4',
                      color: '#4285f4',
                      boxShadow: '0 2px 8px rgba(66, 133, 244, 0.2)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Microsoft />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: 'rgba(0,0,0,0.12)',
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 120, 212, 0.04)',
                      borderColor: '#0078d4',
                      color: '#0078d4',
                      boxShadow: '0 2px 8px rgba(0, 120, 212, 0.2)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Microsoft
                </Button>
              </Stack>
              
            </Stack>
          </Box>
        </Paper>
      </Grid>

      {/* Login con 2FA - DR Group Spectacular */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            �️ DR Group 2FA Premium
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Inspirado en tu 2FA:</strong> Verificación de doble factor con efectos 
            spectacular. Códigos OTP, autenticación empresarial y Design System 3.0 
            aplicado con máxima seguridad visual.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 0,
          border: `1px solid rgba(76, 175, 80, 0.15)`,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,252,248,0.98) 100%)',
          backdropFilter: 'blur(40px)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(76, 175, 80, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4caf50 0%, #388e3c 100%)',
            zIndex: 2
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 15% 15%, rgba(76, 175, 80, 0.04) 0%, transparent 40%),
              radial-gradient(circle at 85% 85%, rgba(56, 142, 60, 0.03) 0%, transparent 40%)
            `,
            animation: 'floatGlow 12s ease-in-out infinite',
            pointerEvents: 'none',
            '@keyframes floatGlow': {
              '0%, 100%': { 
                transform: 'translateY(0) scale(1)',
                opacity: 0.6 
              },
              '33%': { 
                transform: 'translateY(-2px) scale(1.02)',
                opacity: 0.8 
              },
              '66%': { 
                transform: 'translateY(1px) scale(0.98)',
                opacity: 0.7 
              }
            }
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `
              0 16px 48px rgba(0, 0, 0, 0.15),
              0 8px 24px rgba(76, 175, 80, 0.12),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `
          },
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {/* Header 2FA con efectos spectacular */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(232, 245, 233, 0.95) 0%, rgba(237, 247, 237, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px 12px 0 0',
            p: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.2), transparent)'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(76, 175, 80, 0.02) 50%, transparent 70%)',
              animation: 'shimmer 6s infinite',
              pointerEvents: 'none',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }
          }}>
            
            {/* Avatar 2FA con efectos */}
            <Box sx={{
              background: 'linear-gradient(135deg, #4caf50, #388e3c)',
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              boxShadow: `
                0 6px 20px rgba(76, 175, 80, 0.35),
                0 3px 10px rgba(76, 175, 80, 0.25),
                inset 0 1px 0 rgba(255,255,255,0.3)
              `,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                animation: 'shimmer 4s infinite'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(45deg, #4caf50, #388e3c)',
                borderRadius: '10px',
                zIndex: -1,
                opacity: 0.3,
                filter: 'blur(4px)'
              },
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `
                  0 8px 25px rgba(76, 175, 80, 0.45),
                  0 4px 12px rgba(76, 175, 80, 0.30),
                  inset 0 1px 0 rgba(255,255,255,0.4)
                `
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <Security sx={{ 
                fontSize: 32, 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
            </Box>

            {/* Títulos 2FA con gradiente */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 0.5,
                fontSize: '1.6rem',
                background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}>
                Verificación Adicional
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}>
                usuario@drgroup.com • Paso 2 de 2
              </Typography>
            </Box>

            {/* Badge 2FA Premium */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip 
                label="2FA Activo" 
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              />
              <IconButton 
                size="small" 
                sx={{ 
                  color: 'success.main',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Security fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Formulario 2FA Principal */}
          <Box sx={{ p: 4 }}>
            
            {/* Alert mejorado */}
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: '1px solid rgba(2, 136, 209, 0.15)',
                background: 'linear-gradient(135deg, rgba(2, 136, 209, 0.05) 0%, rgba(2, 136, 209, 0.02) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 12px rgba(2, 136, 209, 0.1)',
                '& .MuiAlert-icon': {
                  color: '#0288d1',
                  fontSize: '1.3rem'
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }
              }}
            >
              Hemos enviado un código de 6 dígitos a tu dispositivo móvil registrado
            </Alert>

            <Stack spacing={3}>
              
              {/* Campo Código OTP con efectos spectacular */}
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Código de Verificación
                </Typography>
                
                {/* Campo de código con estilo especial */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  {[0,1,2,3,4,5].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 48,
                        height: 56,
                        border: '2px solid',
                        borderColor: 'rgba(76, 175, 80, 0.2)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255,255,255,0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'success.main',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: 'success.main',
                          backgroundColor: 'rgba(76, 175, 80, 0.05)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
                        },
                        '&:focus-within': {
                          borderColor: 'success.main',
                          backgroundColor: 'white',
                          boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
                          transform: 'translateY(-3px)'
                        }
                      }}
                    >
                      {index === 0 ? '0' : ''}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Botón Principal 2FA */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                endIcon={<Security />}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.35)',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.45)',
                    transform: 'translateY(-3px)'
                  },
                  '&:active': {
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.6s'
                  },
                  '&:hover::before': {
                    left: '100%'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Verificar y Continuar
              </Button>

              {/* Footer con opciones */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 1
              }}>
                <Button 
                  variant="text" 
                  size="small" 
                  sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      color: 'success.main',
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Reenviar código
                </Button>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  ⏱️ Código válido por 5 min
                </Typography>
              </Box>
            </Stack>
          </Box>
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
