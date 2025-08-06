import React, { useState, useEffect } from 'react';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  BusinessCenter,
  Security,
  TrendingUp,
  Analytics
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPreview, setUserPreview] = useState(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(true);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const { login, error, setError, checkEmailExists } = useAuth();
  const theme = useMuiTheme();

  const checkForAdmins = async () => {
    try {
      setCheckingAdmins(true);
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'ADMIN'));
      const adminSnapshot = await getDocs(adminQuery);
      setHasAdmins(!adminSnapshot.empty);
    } catch (error) {
      console.error('Error verificando administradores:', error);
      setHasAdmins(true);
    } finally {
      setCheckingAdmins(false);
    }
  };

  useEffect(() => {
    checkForAdmins();
  }, []);

  const checkUserEmail = async (emailValue) => {
    if (!emailValue || !emailValue.includes('@')) {
      setUserPreview(null);
      return;
    }

    setEmailCheckLoading(true);
    try {
      const realUser = await checkEmailExists(emailValue);
      
      if (realUser) {
        setUserPreview({
          email: emailValue,
          name: realUser.name || realUser.displayName,
          position: realUser.position || realUser.role || 'Usuario del Sistema',
          photoURL: realUser.photoURL,
          isRealUser: true
        });
      } else {
        const emailUser = emailValue.toLowerCase();
        const knownUsers = {
          'admin@drgroup.com': { name: 'Administrador DR Group', position: 'Administrador del Sistema' },
          'diego@drgroup.com': { name: 'Diego Rodriguez', position: 'Director Ejecutivo' },
          'daruedagu@gmail.com': { name: 'Daruedagu', position: 'Usuario del Sistema' }
        };

        setUserPreview({
          email: emailValue,
          ...(knownUsers[emailUser] || {
            name: emailValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            position: 'Usuario del Sistema'
          }),
          photoURL: null,
          isRealUser: false
        });
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setUserPreview(null);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUserEmail(email);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Usuario no encontrado. Verifica tu correo electrónico.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/invalid-email':
          setError('Formato de correo electrónico inválido.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intenta más tarde.');
          break;
        case 'auth/user-disabled':
          setError('Esta cuenta ha sido deshabilitada.');
          break;
        default:
          setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 4,
            alignItems: 'center',
            minHeight: '80vh'
          }}
        >
          {/* Sección Izquierda - Ilustración */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'block' },
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Ilustración principal */}
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  mb: 3,
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  overflow: 'hidden'
                }}
              >
                {/* Icono central animado */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ position: 'relative', zIndex: 2 }}
                >
                  <BusinessCenter 
                    sx={{ 
                      fontSize: 120, 
                      color: theme.palette.primary.main,
                      filter: 'drop-shadow(0 8px 16px rgba(102, 126, 234, 0.3))',
                      mb: 2
                    }} 
                  />
                </motion.div>
                
                {/* Elementos decorativos flotantes */}
                {[
                  { icon: Security, color: theme.palette.secondary.main, delay: 1, size: 20, position: { top: '20%', left: '15%' } },
                  { icon: TrendingUp, color: theme.palette.info.main, delay: 2, size: 15, position: { top: '30%', right: '20%' } },
                  { icon: Analytics, color: theme.palette.warning.main, delay: 0.5, size: 12, position: { bottom: '25%', left: '25%' } }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    animate={{ 
                      y: [0, -20, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      delay: item.delay
                    }}
                    style={{
                      position: 'absolute',
                      ...item.position,
                      zIndex: 2
                    }}
                  >
                    <item.icon sx={{ fontSize: item.size, color: item.color }} />
                  </motion.div>
                ))}
              </Box>
              
              {/* Título principal */}
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 2,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                DR Group
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  opacity: 0.85, 
                  fontWeight: 400,
                  color: theme.palette.mode === 'dark' ? 'white' : 'rgba(255,255,255,0.9)',
                  mb: 4
                }}
              >
                Dashboard Financiero Empresarial
              </Typography>
              
              {/* Stats decorativas */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4 }}>
                {[
                  { label: 'Empresas', value: '50+', icon: '🏢' },
                  { label: 'Transacciones', value: '10K+', icon: '💰' },
                  { label: 'Seguridad', value: '99.9%', icon: '🔒' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
                  >
                    <Box 
                      sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 3,
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                          : '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{stat.icon}</Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: theme.palette.mode === 'dark' ? 'white' : 'rgba(255,255,255,0.95)'
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.8,
                          color: theme.palette.mode === 'dark' ? 'white' : 'rgba(255,255,255,0.8)'
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* Sección Derecha - Formulario */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 6,
                overflow: 'hidden',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(15, 15, 35, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 25px 50px rgba(102, 126, 234, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                position: 'relative'
              }}
            >
              {/* Header del formulario */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white',
                  textAlign: 'center',
                  py: 4,
                  px: 4,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
                  style={{ position: 'relative', zIndex: 2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <BusinessCenter 
                      sx={{ 
                        fontSize: 48, 
                        mb: 2,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }} 
                    />
                  </motion.div>
                  
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    Bienvenido de Vuelta
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300
                    }}
                  >
                    Accede a tu dashboard financiero
                  </Typography>
                </motion.div>
              </Box>

              <CardContent sx={{ p: 4, position: 'relative', zIndex: 2 }}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.error.main}30`,
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)`
                          : `linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)`,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 4px 20px ${theme.palette.error.main}20`
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                  {/* Preview del usuario */}
                  {userPreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 3, 
                          mb: 4,
                          p: 3,
                          borderRadius: 4,
                          background: theme.palette.mode === 'dark' 
                            ? `linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.08) 100%)`
                            : `linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)`,
                          border: `1px solid ${theme.palette.primary.main}25`,
                          backdropFilter: 'blur(10px)',
                          boxShadow: `0 8px 32px ${theme.palette.primary.main}15`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Avatar
                          src={userPreview.photoURL}
                          sx={{ 
                            width: 56, 
                            height: 56,
                            border: userPreview.isRealUser 
                              ? `3px solid ${theme.palette.primary.main}` 
                              : `2px solid ${theme.palette.divider}`,
                            boxShadow: `0 8px 24px ${theme.palette.primary.main}30`,
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
                          {!userPreview.photoURL && (userPreview.name?.charAt(0) || userPreview.email?.charAt(0)?.toUpperCase())}
                        </Avatar>
                        <Box sx={{ position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" fontWeight={600} color="text.primary">
                              {userPreview.name || 'Usuario'}
                            </Typography>
                            {userPreview.isRealUser && (
                              <Chip 
                                label="✓ Verificado" 
                                size="small" 
                                color="primary" 
                                variant="filled"
                                sx={{ 
                                  height: 22, 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                  color: 'white',
                                  boxShadow: `0 4px 12px ${theme.palette.success.main}40`
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                            {userPreview.position || userPreview.email}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  )}

                  {/* Campos del formulario con diseño premium */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <TextField
                      fullWidth
                      label="Correo Electrónico"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(255, 255, 255, 0.9)',
                            boxShadow: `0 8px 32px ${theme.palette.primary.main}20`,
                            transform: 'translateY(-2px)'
                          },
                          '&.Mui-focused': {
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.07)'
                              : 'rgba(255, 255, 255, 0.95)',
                            boxShadow: `0 0 0 2px ${theme.palette.primary.main}40, 0 8px 32px ${theme.palette.primary.main}25`,
                            transform: 'translateY(-2px)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {emailCheckLoading ? (
                              <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                            ) : (
                              <Email sx={{ color: theme.palette.primary.main }} />
                            )}
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                  >
                    <TextField
                      fullWidth
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      sx={{ 
                        mb: 4,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(255, 255, 255, 0.9)',
                            boxShadow: `0 8px 32px ${theme.palette.primary.main}20`,
                            transform: 'translateY(-2px)'
                          },
                          '&.Mui-focused': {
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.07)'
                              : 'rgba(255, 255, 255, 0.95)',
                            boxShadow: `0 0 0 2px ${theme.palette.primary.main}40, 0 8px 32px ${theme.palette.primary.main}25`,
                            transform: 'translateY(-2px)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: theme.palette.primary.main }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleTogglePassword}
                              edge="end"
                              disabled={loading}
                              sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                  color: theme.palette.primary.main,
                                  background: `${theme.palette.primary.main}10`
                                }
                              }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        textTransform: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.6s',
                          zIndex: 1
                        },
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                          boxShadow: `0 12px 40px ${theme.palette.primary.main}50`,
                          transform: 'translateY(-4px)',
                          '&::before': {
                            left: '100%'
                          }
                        },
                        '&:active': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 32px ${theme.palette.primary.main}40`
                        },
                        '&:disabled': {
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.12)',
                          boxShadow: 'none',
                          transform: 'none'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        {loading ? (
                          <>
                            <CircularProgress size={24} color="inherit" />
                            <Typography sx={{ fontWeight: 700 }}>
                              Verificando acceso...
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography sx={{ fontWeight: 700 }}>
                              Ingresar al Dashboard
                            </Typography>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              →
                            </motion.div>
                          </>
                        )}
                      </Box>
                    </Button>
                  </motion.div>
                </Box>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        opacity: 0.8
                      }}
                    >
                      🔒 Acceso seguro con encriptación de extremo a extremo
                    </Typography>
                    
                    {/* Configuración inicial */}
                    {!checkingAdmins && !hasAdmins && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6, duration: 0.3 }}
                      >
                        <Alert 
                          severity="info" 
                          sx={{ 
                            mt: 3, 
                            borderRadius: 4,
                            background: theme.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(103, 58, 183, 0.05) 100%)'
                              : 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(103, 58, 183, 0.04) 100%)',
                            border: `1px solid ${theme.palette.info.main}30`,
                            backdropFilter: 'blur(10px)',
                            boxShadow: `0 4px 20px ${theme.palette.info.main}20`
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2,
                              fontWeight: 600,
                              color: 'text.primary'
                            }}
                          >
                            🚀 Sistema sin configurar
                          </Typography>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outlined"
                              size="medium"
                              onClick={() => window.location.href = '/admin-setup'}
                              sx={{
                                borderColor: theme.palette.info.main,
                                color: theme.palette.info.main,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                borderRadius: 3,
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(33, 150, 243, 0.05)'
                                  : 'rgba(33, 150, 243, 0.02)',
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                  background: theme.palette.info.main,
                                  color: 'white',
                                  borderColor: theme.palette.info.main,
                                  boxShadow: `0 4px 20px ${theme.palette.info.main}40`
                                }
                              }}
                            >
                              Configurar Primer Administrador
                            </Button>
                          </motion.div>
                        </Alert>
                      </motion.div>
                    )}
                    
                    {checkingAdmins && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.3 }}
                      >
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                          <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            Verificando configuración del sistema...
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                  </Box>
                </motion.div>
              </CardContent>
            </Paper>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginForm;
