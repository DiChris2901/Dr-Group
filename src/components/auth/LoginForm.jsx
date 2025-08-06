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
import { useSettings } from '../../context/SettingsContext';

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
  const { settings } = useSettings();

  // 🎨 Design System Spectacular - Configuraciones dinámicas del usuario
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  const fontSize = settings?.theme?.fontSize || 14;
  const compactMode = settings?.sidebar?.compactMode || false;

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
        background: `linear-gradient(135deg, 
          ${primaryColor}08 0%, 
          ${secondaryColor}12 50%, 
          ${theme.palette.background.default} 100%
        )`,
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compactMode ? 2 : 3,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 25% 25%, ${primaryColor}06 0%, transparent 50%), 
                      radial-gradient(circle at 75% 75%, ${secondaryColor}04 0%, transparent 50%)`,
          zIndex: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, ${primaryColor}03 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${secondaryColor}03 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${primaryColor}02 0%, transparent 30%)
          `,
          animation: animationsEnabled ? 'floatParticles 20s ease-in-out infinite' : 'none',
          zIndex: 0,
          '@keyframes floatParticles': {
            '0%, 100%': { 
              transform: 'translateY(0) translateX(0) scale(1)',
              opacity: 0.7 
            },
            '25%': { 
              transform: 'translateY(-10px) translateX(5px) scale(1.05)',
              opacity: 0.8 
            },
            '50%': { 
              transform: 'translateY(-5px) translateX(-10px) scale(0.95)',
              opacity: 0.6 
            },
            '75%': { 
              transform: 'translateY(8px) translateX(-5px) scale(1.02)',
              opacity: 0.9 
            }
          }
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: 50, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={animationsEnabled ? { 
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1]
          } : { duration: 0 }}
        >
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}15`,
              borderRadius: `${borderRadius * 1.5}px`,
              background: `linear-gradient(135deg,
                ${primaryColor}03 0%,
                ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} 100%
              )`,
              backdropFilter: 'blur(40px)',
              boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.12)'}`,
              position: 'relative',
              overflow: 'hidden',
              transition: animationsEnabled ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg,
                  ${primaryColor} 0%,
                  ${secondaryColor} 100%
                )`
              },
              '&:hover': animationsEnabled ? {
                transform: 'translateY(-4px)',
                boxShadow: `
                  0 16px 48px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)'},
                  0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.10)'}
                `
              } : {}
            }}
          >
            {/* Header Card similar al drawer de configuración */}
            <Box
              sx={{
                background: `linear-gradient(135deg,
                  ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'} 0%,
                  ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} 100%
                )`,
                backdropFilter: 'blur(20px)',
                borderRadius: `${borderRadius * 1.5}px ${borderRadius * 1.5}px 0 0`,
                p: compactMode ? 3 : 4,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                '&::after': animationsEnabled ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${theme.palette.divider}30, transparent)`,
                } : {}
              }}
            >
              {/* Avatar Icon con estilo del drawer */}
              <Box sx={{
                background: `linear-gradient(135deg, 
                  ${primaryColor}, 
                  ${theme.palette.mode === 'dark' ? primaryColor + 'CC' : primaryColor + 'DD'}
                )`,
                borderRadius: `${borderRadius}px`,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                boxShadow: `0 4px 16px ${primaryColor}30`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': animationsEnabled ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                  animation: 'shimmer 4s infinite',
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                  }
                } : {}
              }}>
                <BusinessCenter 
                  sx={{ 
                    fontSize: compactMode ? 28 : 32, 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }} 
                />
              </Box>

              {/* Títulos con gradiente de texto */}
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 0.5,
                    fontSize: compactMode ? '1.5rem' : '1.8rem',
                    background: `linear-gradient(135deg, 
                      ${primaryColor}, 
                      ${secondaryColor}
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  DR Group
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: compactMode ? '0.9rem' : '1rem'
                  }}
                >
                  Centro de Control Empresarial
                </Typography>
              </Box>
            </Box>

            {/* CardContent con estilo del drawer */}
            <CardContent sx={{ 
              p: compactMode ? 3 : 4,
              background: `linear-gradient(135deg,
                ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'} 0%,
                ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'} 100%
              )`,
              backdropFilter: 'blur(20px)',
              borderRadius: `0 0 ${borderRadius * 1.5}px ${borderRadius * 1.5}px`
            }}>
              <motion.div
                initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={animationsEnabled ? { delay: 0.6, duration: 0.6 } : { duration: 0 }}
              >
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    textAlign: 'center', 
                    mb: compactMode ? 3 : 4, 
                    fontWeight: 700,
                    fontSize: compactMode ? '1.4rem' : '1.6rem',
                    letterSpacing: '-0.01em',
                    background: `linear-gradient(135deg, 
                      ${theme.palette.text.primary}, 
                      ${theme.palette.text.secondary}
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Iniciar Sesión
                </Typography>
              </motion.div>

              {error && (
                <motion.div
                  initial={animationsEnabled ? { opacity: 0, scale: 0.95, y: -10 } : { opacity: 1, scale: 1, y: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={animationsEnabled ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: compactMode ? 3 : 4, 
                      border: `1px solid ${theme.palette.error.main}20`,
                      borderRadius: `${borderRadius}px`,
                      background: `linear-gradient(135deg,
                        ${theme.palette.error.main}08 0%,
                        ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} 100%
                      )`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: `0 4px 16px ${theme.palette.error.main}15`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg,
                          ${theme.palette.error.main} 0%,
                          ${theme.palette.error.dark} 100%
                        )`
                      },
                      '& .MuiAlert-icon': {
                        color: theme.palette.error.main
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                {/* Preview del usuario mejorado */}
                {userPreview && (
                  <motion.div
                    initial={animationsEnabled ? { opacity: 0, y: -10, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={animationsEnabled ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: compactMode ? 2 : 3, 
                        mb: compactMode ? 3 : 4,
                        p: compactMode ? 2.5 : 3,
                        border: `1px solid ${theme.palette.divider}15`,
                        borderRadius: `${borderRadius}px`,
                        background: `linear-gradient(135deg,
                          ${primaryColor}05 0%,
                          ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} 100%
                        )`,
                        backdropFilter: 'blur(20px)',
                        boxShadow: `0 4px 16px ${primaryColor}10`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: `linear-gradient(90deg,
                            ${primaryColor} 0%,
                            ${secondaryColor} 100%
                          )`
                        },
                        '&::after': animationsEnabled ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(45deg, transparent 30%, ${primaryColor}03 50%, transparent 70%)`,
                          animation: 'shimmer 3s infinite'
                        } : {}
                      }}
                    >
                      <Avatar
                        src={userPreview.photoURL}
                        sx={{ 
                          width: compactMode ? 40 : 48, 
                          height: compactMode ? 40 : 48,
                          background: !userPreview.photoURL ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : 'transparent',
                          border: userPreview.isRealUser 
                            ? `2px solid ${primaryColor}` 
                            : `1px solid ${theme.palette.divider}40`,
                          boxShadow: `0 4px 16px ${primaryColor}25`,
                          position: 'relative',
                          zIndex: 2,
                          fontSize: compactMode ? '1rem' : '1.2rem',
                          fontWeight: 700,
                          color: 'white',
                          '&::before': userPreview.isRealUser && animationsEnabled ? {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
                            borderRadius: '50%',
                            zIndex: -1,
                            animation: 'pulse-glow 2s infinite',
                            '@keyframes pulse-glow': {
                              '0%, 100%': { 
                                opacity: 0.5,
                                transform: 'scale(1)' 
                              },
                              '50%': { 
                                opacity: 0.8,
                                transform: 'scale(1.05)' 
                              }
                            }
                          } : {}
                        }}
                      >
                        {!userPreview.photoURL && (userPreview.name?.charAt(0) || userPreview.email?.charAt(0)?.toUpperCase())}
                      </Avatar>
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography 
                            variant="body1" 
                            fontWeight={700} 
                            sx={{ 
                              color: theme.palette.text.primary,
                              fontSize: compactMode ? '1rem' : '1.1rem'
                            }}
                          >
                            {userPreview.name || 'Usuario'}
                          </Typography>
                          {userPreview.isRealUser && (
                            <Chip 
                              label="Verificado" 
                              size="small" 
                              sx={{ 
                                height: 22, 
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                color: theme.palette.success.contrastText,
                                border: 'none'
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                          }}
                        >
                          {userPreview.position || userPreview.email}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                )}

                <motion.div
                  initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={animationsEnabled ? { delay: 0.8, duration: 0.5 } : { duration: 0 }}
                >
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    sx={{ 
                      mb: compactMode ? 3 : 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: `${borderRadius}px`,
                        height: compactMode ? 48 : 56,
                        background: `linear-gradient(135deg,
                          ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)'} 0%,
                          ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'} 100%
                        )`,
                        backdropFilter: 'blur(20px)',
                        transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        '& fieldset': {
                          borderColor: `${theme.palette.divider}40`,
                          borderWidth: 1
                        },
                        '&:hover fieldset': {
                          borderColor: `${primaryColor}60`,
                          borderWidth: 1,
                          boxShadow: `0 0 0 2px ${primaryColor}10`
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor,
                          borderWidth: 2,
                          boxShadow: `0 0 0 4px ${primaryColor}15`
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        fontSize: `${fontSize}px`,
                        '&.Mui-focused': {
                          color: primaryColor,
                          fontWeight: 700
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: `${fontSize}px`,
                        fontWeight: 500,
                        color: theme.palette.text.primary
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {emailCheckLoading ? (
                            <CircularProgress size={compactMode ? 20 : 22} sx={{ color: primaryColor }} />
                          ) : (
                            <Email sx={{ 
                              color: primaryColor,
                              fontSize: compactMode ? 20 : 22
                            }} />
                          )}
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                </motion.div>

                <motion.div
                  initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={animationsEnabled ? { delay: 1.0, duration: 0.5 } : { duration: 0 }}
                >
                  <TextField
                    fullWidth
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    sx={{ 
                      mb: compactMode ? 4 : 5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: `${borderRadius}px`,
                        height: compactMode ? 48 : 56,
                        background: `linear-gradient(135deg,
                          ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)'} 0%,
                          ${theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'} 100%
                        )`,
                        backdropFilter: 'blur(20px)',
                        transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        '& fieldset': {
                          borderColor: `${theme.palette.divider}40`,
                          borderWidth: 1
                        },
                        '&:hover fieldset': {
                          borderColor: `${primaryColor}60`,
                          borderWidth: 1,
                          boxShadow: `0 0 0 2px ${primaryColor}10`
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor,
                          borderWidth: 2,
                          boxShadow: `0 0 0 4px ${primaryColor}15`
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        fontSize: `${fontSize}px`,
                        '&.Mui-focused': {
                          color: primaryColor,
                          fontWeight: 700
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: `${fontSize}px`,
                        fontWeight: 500,
                        color: theme.palette.text.primary
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ 
                            color: primaryColor,
                            fontSize: compactMode ? 20 : 22
                          }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePassword}
                            edge="end"
                            disabled={loading}
                            sx={{ color: theme.palette.text.secondary }}
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
                  initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={animationsEnabled ? { delay: 1.2, duration: 0.6 } : { duration: 0 }}
                  whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                  whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: compactMode ? 1.75 : 2.5,
                      borderRadius: `${borderRadius}px`,
                      fontSize: `${fontSize + 2}px`,
                      fontWeight: 700,
                      textTransform: 'none',
                      background: `linear-gradient(135deg,
                        ${primaryColor} 0%,
                        ${secondaryColor} 100%
                      )`,
                      backgroundSize: '200% 200%',
                      backgroundPosition: '0% 50%',
                      boxShadow: `
                        0 8px 32px ${primaryColor}25,
                        0 4px 16px ${primaryColor}20,
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `,
                      border: `1px solid ${primaryColor}30`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: animationsEnabled ? 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        transition: animationsEnabled ? 'left 0.8s ease-in-out' : 'none'
                      },
                      '&:hover': {
                        backgroundPosition: '100% 50%',
                        boxShadow: `
                          0 12px 40px ${primaryColor}35,
                          0 6px 20px ${primaryColor}25,
                          inset 0 1px 0 rgba(255,255,255,0.3)
                        `,
                        transform: animationsEnabled ? 'translateY(-2px)' : 'none',
                        '&:before': {
                          left: '100%'
                        }
                      },
                      '&:disabled': {
                        background: `linear-gradient(135deg,
                          ${theme.palette.action.disabled} 0%,
                          ${theme.palette.action.disabled} 100%
                        )`,
                        color: theme.palette.text.disabled,
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.action.disabled}`,
                        '&:before': {
                          display: 'none'
                        }
                      }
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={24} color="inherit" />
                        <Typography sx={{ fontWeight: 700, color: 'inherit' }}>
                          Verificando acceso...
                        </Typography>
                      </Box>
                    ) : (
                      'Ingresar al Centro de Control'
                    )}
                  </Button>
                </motion.div>
              </Box>

              <motion.div
                initial={animationsEnabled ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={animationsEnabled ? { delay: 1.4, duration: 0.6 } : { duration: 0 }}
              >
                <Box sx={{ textAlign: 'center', mt: compactMode ? 3 : 4 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: `${fontSize - 1}px`
                    }}
                  >
                    🔒 Sistema de Gestión Financiera Empresarial
                  </Typography>
                  
                  {/* Enlace para configuración inicial - Solo aparece si no hay administradores */}
                  {!checkingAdmins && !hasAdmins && (
                    <motion.div
                      initial={animationsEnabled ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={animationsEnabled ? { delay: 1.6, duration: 0.4 } : { duration: 0 }}
                    >
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: compactMode ? 2.5 : 3, 
                          borderRadius: borderRadius / 2,
                          background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.info.main}05)`,
                          border: `1px solid ${theme.palette.info.main}20`,
                          backdropFilter: 'blur(10px)',
                          '& .MuiAlert-icon': {
                            color: theme.palette.info.main
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: compactMode ? 1 : 1.5, fontWeight: 600 }}>
                          🚀 Sistema sin configurar
                        </Typography>
                        <Button
                          variant="outlined"
                          size={compactMode ? "small" : "medium"}
                          onClick={() => window.location.href = '/admin-setup'}
                          sx={{
                            borderColor: theme.palette.info.main,
                            color: theme.palette.info.main,
                            fontSize: compactMode ? '0.8rem' : '0.875rem',
                            fontWeight: 600,
                            borderRadius: borderRadius / 3,
                            textTransform: 'none',
                            '&:hover': {
                              background: theme.palette.info.main,
                              color: theme.palette.info.contrastText,
                              borderColor: theme.palette.info.main
                            }
                          }}
                        >
                          Configurar Primer Administrador
                        </Button>
                      </Alert>
                    </motion.div>
                  )}
                  
                  {checkingAdmins && (
                    <Box sx={{ mt: compactMode ? 2.5 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
                      <CircularProgress 
                        size={compactMode ? 16 : 18} 
                        sx={{ color: primaryColor }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          fontSize: `${fontSize - 2}px`
                        }}
                      >
                        Verificando configuración del sistema...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>
            </CardContent>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginForm;
