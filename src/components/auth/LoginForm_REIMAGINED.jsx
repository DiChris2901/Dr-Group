import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  BusinessCenter,
  LockOutlined
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3
      }}
    >
      {/* Contenedor principal con layout horizontal */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          maxWidth: 1200,
          width: '100%',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            gap: 4
          }
        }}
      >
        {/* Panel Izquierdo - Ilustración */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
          >
            {/* Card principal con icono */}
            <Card
              sx={{
                width: 280,
                height: 200,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
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
              >
                <BusinessCenter 
                  sx={{ 
                    fontSize: 80,
                    color: '#4FC3F7',
                    filter: 'drop-shadow(0 4px 8px rgba(79, 195, 247, 0.3))'
                  }} 
                />
              </motion.div>
            </Card>

            {/* Título y subtítulo */}
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: '2rem'
                }}
              >
                DR Group
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: '1rem'
                }}
              >
                Dashboard Financiero Empresarial
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2,
                justifyContent: 'center'
              }}
            >
              {[
                { label: 'Empresas', value: '50+' },
                { label: 'Transacciones', value: '10K+' },
                { label: 'Seguridad', value: '99.9%' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.2 }}
                >
                  <Card
                    sx={{
                      width: 80,
                      height: 60,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        lineHeight: 1
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        opacity: 0.8,
                        lineHeight: 1
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Panel Derecho - Formulario de Login */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Card
            sx={{
              width: 420,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              background: 'white'
            }}
          >
            {/* Header azul */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                color: 'white',
                textAlign: 'center',
                py: 3,
                px: 3,
                position: 'relative'
              }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <LockOutlined 
                  sx={{ 
                    fontSize: 40,
                    mb: 1
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.3rem'
                  }}
                >
                  Bienvenido de Vuelta
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: '0.85rem'
                  }}
                >
                  Accede a tu dashboard financiero
                </Typography>
              </motion.div>
            </Box>

            {/* Contenido del formulario */}
            <CardContent sx={{ p: 4 }}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                {/* Preview del usuario */}
                {userPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 3,
                        p: 2,
                        borderRadius: 3,
                        background: 'rgba(66, 165, 245, 0.08)',
                        border: '1px solid rgba(66, 165, 245, 0.2)'
                      }}
                    >
                      <Avatar
                        src={userPreview.photoURL}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: userPreview.isRealUser ? '#42A5F5' : '#ccc'
                        }}
                      >
                        {!userPreview.photoURL && (userPreview.name?.charAt(0) || userPreview.email?.charAt(0)?.toUpperCase())}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {userPreview.name || 'Usuario'}
                          </Typography>
                          {userPreview.isRealUser && (
                            <Chip 
                              label="✓" 
                              size="small" 
                              color="success"
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {userPreview.position || userPreview.email}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                )}

                {/* Campo Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Correo Electrónico
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="usuario@ejemplo.com"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#42A5F5'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#42A5F5'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {emailCheckLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Email sx={{ color: '#42A5F5', fontSize: 20 }} />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Campo Contraseña */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Contraseña
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    sx={{ 
                      mb: 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#42A5F5'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#42A5F5'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#42A5F5', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePassword}
                            edge="end"
                            disabled={loading}
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Botón de Login */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                        boxShadow: '0 6px 16px rgba(66, 165, 245, 0.5)'
                      },
                      '&:disabled': {
                        background: '#ccc'
                      }
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <Typography>Verificando acceso...</Typography>
                      </Box>
                    ) : (
                      <>
                        Ingresar al Dashboard →
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Footer del formulario */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      🔒 Acceso seguro con encriptación de extremo a extremo
                    </Typography>
                    
                    {/* Configuración inicial */}
                    {!checkingAdmins && !hasAdmins && (
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          fontSize: '0.85rem'
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          🚀 Sistema sin configurar
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => window.location.href = '/admin-setup'}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Configurar Primer Administrador
                        </Button>
                      </Alert>
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
                </motion.div>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginForm;
