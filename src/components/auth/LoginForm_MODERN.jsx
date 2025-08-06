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
  Person,
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
        padding: 3,
        position: 'relative'
      }}
    >
      {/* Formas decorativas de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        {/* Forma curva principal */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            left: -200,
            width: 800,
            height: 600,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            transform: 'rotate(-15deg)'
          }}
        />
        {/* Círculos decorativos */}
        <Box
          sx={{
            position: 'absolute',
            top: 100,
            right: 100,
            width: 60,
            height: 60,
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 200,
            left: 150,
            width: 30,
            height: 30,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }}
        />
      </Box>

      {/* Contenedor principal */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          maxWidth: 1200,
          width: '100%',
          position: 'relative',
          zIndex: 2,
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            gap: 4
          }
        }}
      >
        {/* Panel Izquierdo - Ilustración Moderna */}
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
              gap: 4,
              width: 400
            }}
          >
            {/* Ilustración principal con smartphone */}
            <Box
              sx={{
                position: 'relative',
                width: 350,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Smartphone mockup */}
              <Box
                sx={{
                  width: 180,
                  height: 320,
                  background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)',
                  borderRadius: 8,
                  border: '3px solid #333',
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Notch del teléfono */}
                <Box
                  sx={{
                    width: 80,
                    height: 20,
                    background: '#1a1a1a',
                    borderRadius: '0 0 15px 15px',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 3
                  }}
                />
                
                {/* Pantalla del teléfono */}
                <Box
                  sx={{
                    flex: 1,
                    background: 'white',
                    margin: '5px 8px 8px 8px',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 2
                  }}
                >
                  {/* Header de la app */}
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
                      borderRadius: 2,
                      p: 1.5,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <LockOutlined sx={{ fontSize: 16, mr: 1 }} />
                    <Typography sx={{ fontSize: 10, fontWeight: 600 }}>
                      Password
                    </Typography>
                  </Box>
                  
                  {/* Campos de contraseña */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, justifyContent: 'center' }}>
                    {[1,2,3,4,5].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: i <= 4 ? '#7c4dff' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {i <= 4 && (
                          <Typography sx={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>
                            ★
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Botón Done */}
                  <Button
                    sx={{
                      background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
                      color: 'white',
                      fontSize: 8,
                      py: 0.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Done
                  </Button>
                  
                  {/* Puntos de navegación */}
                  <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center' }}>
                    {[1,2,3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          background: i === 2 ? '#7c4dff' : '#ccc'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Personaje femenino */}
              <Box
                sx={{
                  position: 'absolute',
                  right: -50,
                  bottom: 0,
                  width: 120,
                  height: 200,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                  borderRadius: '60px 60px 0 0',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  pb: 2
                }}
              >
                {/* Representación simple del personaje */}
                <Box
                  sx={{
                    width: 60,
                    height: 120,
                    background: 'linear-gradient(180deg, #ffb74d 0%, #ff9800 50%, #424242 51%, #424242 100%)',
                    borderRadius: '30px 30px 5px 5px',
                    position: 'relative'
                  }}
                >
                  {/* Cabeza */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      background: '#ffb74d',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: -20,
                      left: 10,
                      border: '2px solid #ff9800'
                    }}
                  />
                </Box>
              </Box>

              {/* Elementos decorativos flotantes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ position: 'absolute', top: 50, left: 50 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%'
                  }}
                />
              </motion.div>

              {/* Planta decorativa */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: 30,
                  width: 30,
                  height: 40,
                  background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
                  borderRadius: '15px 15px 5px 5px'
                }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Panel Derecho - Formulario de Login Moderno */}
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
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              background: 'white',
              position: 'relative'
            }}
          >
            {/* Header con gradiente moderno */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                color: 'white',
                textAlign: 'center',
                py: 4,
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
                    fontSize: 48,
                    mb: 2
                  }} 
                />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    mb: 1
                  }}
                >
                  Bienvenido de Vuelta
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: '0.95rem'
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
                      borderRadius: 3
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                {/* Preview del usuario mejorado */}
                {userPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2.5, 
                        mb: 4,
                        p: 3,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.08) 0%, rgba(30, 136, 229, 0.05) 100%)',
                        border: '1px solid rgba(66, 165, 245, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Avatar
                        src={userPreview.photoURL}
                        sx={{ 
                          width: 50, 
                          height: 50,
                          bgcolor: userPreview.isRealUser ? '#42A5F5' : '#90A4AE',
                          boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)'
                        }}
                      >
                        {!userPreview.photoURL && (userPreview.name?.charAt(0) || userPreview.email?.charAt(0)?.toUpperCase())}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                            {userPreview.name || 'Usuario'}
                          </Typography>
                          {userPreview.isRealUser && (
                            <Chip 
                              label="Verificado" 
                              size="small" 
                              color="success"
                              sx={{ 
                                height: 22, 
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {userPreview.position || userPreview.email}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                )}

                {/* Campo Email moderno */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1.5, 
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
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
                        borderRadius: 3,
                        height: 56,
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A5F5'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#42A5F5',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {emailCheckLoading ? (
                            <CircularProgress size={22} sx={{ color: '#42A5F5' }} />
                          ) : (
                            <Email sx={{ color: '#42A5F5', fontSize: 22 }} />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </motion.div>

                {/* Campo Contraseña moderno */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1.5, 
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
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
                        borderRadius: 3,
                        height: 56,
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A5F5'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#42A5F5',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#42A5F5', fontSize: 22 }} />
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

                {/* Botón de Login premium */}
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
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
                      textTransform: 'none',
                      boxShadow: '0 8px 24px rgba(66, 165, 245, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                        boxShadow: '0 12px 32px rgba(66, 165, 245, 0.5)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: '#e0e0e0',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={24} color="inherit" />
                        <Typography sx={{ fontWeight: 700 }}>Verificando acceso...</Typography>
                      </Box>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </motion.div>

                {/* Footer del formulario */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                      }}
                    >
                      🔒 Acceso seguro con encriptación de extremo a extremo
                    </Typography>
                    
                    {/* Configuración inicial */}
                    {!checkingAdmins && !hasAdmins && (
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: 3,
                          borderRadius: 3,
                          fontSize: '0.85rem'
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          🚀 Sistema sin configurar
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => window.location.href = '/admin-setup'}
                          sx={{ 
                            fontSize: '0.8rem',
                            textTransform: 'none'
                          }}
                        >
                          Configurar Primer Administrador
                        </Button>
                      </Alert>
                    )}
                    
                    {checkingAdmins && (
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} />
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
