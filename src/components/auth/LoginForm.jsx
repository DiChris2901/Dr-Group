import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
  Fade,
  Chip
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  BusinessCenter
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

// Firebase imports para verificar administradores
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPreview, setUserPreview] = useState(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(true); // Por defecto asumimos que hay admins
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const { login, error, setError, getUserByEmail, checkEmailExists } = useAuth();
  const theme = useMuiTheme();

  // Verificar si existen administradores en el sistema
  const checkForAdmins = async () => {
    try {
      setCheckingAdmins(true);
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'ADMIN'));
      const adminSnapshot = await getDocs(adminQuery);
      
      setHasAdmins(!adminSnapshot.empty);
      console.log(adminSnapshot.empty ? '⚠️ No hay administradores en el sistema' : '✅ Sistema con administradores configurado');
    } catch (error) {
      console.error('Error verificando administradores:', error);
      setHasAdmins(true); // En caso de error, asumir que hay admins para no mostrar el enlace
    } finally {
      setCheckingAdmins(false);
    }
  };

  // Verificar administradores al cargar el componente
  useEffect(() => {
    checkForAdmins();
  }, []);

  // Función para verificar email y mostrar preview del usuario
  const checkUserEmail = async (emailValue) => {
    if (!emailValue || !emailValue.includes('@')) {
      setUserPreview(null);
      return;
    }

    setEmailCheckLoading(true);
    try {
      console.log('🔍 Verificando email:', emailValue);
      
      // Primero intentar obtener datos reales de Firebase
      const realUser = await checkEmailExists(emailValue);
      
      if (realUser) {
        console.log('✅ Usuario real encontrado:', realUser);
        setUserPreview({
          email: emailValue,
          name: realUser.name || realUser.displayName,
          position: realUser.position || realUser.role || 'Usuario del Sistema',
          photoURL: realUser.photoURL,
          isRealUser: true
        });
      } else {
        console.log('💡 Creando preview genérico para:', emailValue);
        // Fallback: crear preview genérico si no se puede acceder a Firebase
        const emailUser = emailValue.toLowerCase();
        
        // Lista de usuarios conocidos (como fallback)
        const knownUsers = {
          'admin@drgroup.com': {
            name: 'Administrador DR Group',
            position: 'Administrador del Sistema',
            photoURL: null
          },
          'diego@drgroup.com': {
            name: 'Diego Rodriguez',
            position: 'Director Ejecutivo',
            photoURL: null
          },
          'daruedagu@gmail.com': {
            name: 'Daruedagu',
            position: 'Usuario del Sistema',
            photoURL: null
          }
        };

        if (knownUsers[emailUser]) {
          setUserPreview({
            email: emailValue,
            ...knownUsers[emailUser],
            isRealUser: false
          });
        } else {
          // Preview genérico para emails desconocidos
          const genericUser = {
            email: emailValue,
            name: emailValue.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            position: 'Usuario del Sistema',
            photoURL: null,
            isRealUser: false
          };
          setUserPreview(genericUser);
        }
      }
    } catch (error) {
      console.error('❌ Error verificando email:', error);
      setUserPreview(null);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Debounce para la búsqueda de email
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUserEmail(email);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

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
      console.error('Error en login:', err);
      
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
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: theme.palette.mode === 'dark' 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : 'none'
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                textAlign: 'center',
                py: 4,
                px: 3
              }}
            >
              <BusinessCenter sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                DR Group
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Dashboard Financiero
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 3, 
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                Iniciar Sesión
              </Typography>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                {/* Preview del usuario */}
                {userPreview && (
                  <Fade in={true}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(102, 126, 234, 0.1)' 
                          : 'rgba(102, 126, 234, 0.05)',
                        border: `1px solid ${theme.palette.primary.main}40`
                      }}
                    >
                      <Avatar
                        src={userPreview.photoURL}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: userPreview.isRealUser ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`
                        }}
                      >
                        {!userPreview.photoURL && (userPreview.name?.charAt(0) || userPreview.email?.charAt(0)?.toUpperCase())}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={500} color="text.primary">
                            {userPreview.name || 'Usuario'}
                          </Typography>
                          {userPreview.isRealUser && (
                            <Chip 
                              label="Verificado" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {userPreview.position || userPreview.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                )}

                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {emailCheckLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Email sx={{ color: 'primary.main' }} />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Ingresar al Dashboard'
                  )}
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Control de Compromisos Financieros
                </Typography>
                
                {/* Enlace para configuración inicial - Solo aparece si no hay administradores */}
                {!checkingAdmins && !hasAdmins && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2, 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(103, 58, 183, 0.1) 100%)',
                        border: '1px solid rgba(33, 150, 243, 0.2)'
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Sistema sin configurar
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.location.href = '/admin-setup'}
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'primary.main',
                            color: 'white',
                          }
                        }}
                      >
                        Configurar Primer Administrador
                      </Button>
                    </Alert>
                  </motion.div>
                )}
                
                {checkingAdmins && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Verificando configuración...
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginForm;
