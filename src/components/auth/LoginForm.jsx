import {
  AutoAwesome,
  Email,
  Lock,
  Verified,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import DrGroupLogo from '../common/DrGroupLogo';

// Firebase imports para verificar administradores
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPreview, setUserPreview] = useState(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(true); // Por defecto asumimos que hay admins
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const { login, error, setError, getUserByEmail, checkEmailExists } = useAuth();
  const theme = useMuiTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  // Media query para diseño responsive
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🎨 Design System Spectacular - Configuraciones dinámicas del usuario
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  const fontSize = settings?.theme?.fontSize || 14;
  const compactMode = settings?.sidebar?.compactMode || false;

  // 🕒 Helper para formatear tiempo relativo
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Nunca';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 30) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  // Verificar si existen administradores en el sistema
  const checkForAdmins = async () => {
    try {
      setCheckingAdmins(true);
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'ADMIN'));
      const adminSnapshot = await getDocs(adminQuery);
      
      setHasAdmins(!adminSnapshot.empty);
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
      setShowSkeleton(false);
      return;
    }

    setEmailCheckLoading(true);
    setShowSkeleton(true);
    setUserPreview(null);
    
    try {
      
      // Simular delay mínimo para mostrar skeleton
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Primero intentar obtener datos reales de Firebase
      const realUser = await checkEmailExists(emailValue);
      
      if (realUser) {
        setUserPreview({
          email: emailValue,
          name: realUser.name || realUser.displayName,
          position: realUser.position || realUser.role || 'Usuario del Sistema',
          department: realUser.department || 'Organización RDJ',
          photoURL: realUser.photoURL,
          lastLogin: realUser.lastLogin || new Date().toISOString(),
          accountType: realUser.role === 'ADMIN' ? 'Administrador' : 
                      realUser.role === 'MANAGER' ? 'Gerente' : 'Usuario',
          isRealUser: true,
          isActive: realUser.isActive !== false,
          joinDate: realUser.createdAt || new Date().toISOString()
        });
      } else {
        
        // Verificar si es un usuario conocido del sistema (fallback)
        const emailUser = emailValue.toLowerCase();
        const knownUsers = {
          'admin@drgroup.com': {
            name: 'Administrador del Sistema',
            position: 'Administrador del Sistema',
            department: 'Tecnología',
            photoURL: null,
            accountType: 'Administrador',
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            joinDate: '2024-01-01T00:00:00.000Z'
          },
          'diego@drgroup.com': {
            name: 'Diego Rodriguez',
            position: 'Director Ejecutivo',
            department: 'Dirección General',
            photoURL: null,
            accountType: 'Administrador',
            lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            joinDate: '2024-01-01T00:00:00.000Z'
          },
          'daruedagu@gmail.com': {
            name: 'Daruedagu',
            position: 'Analista de Sistemas',
            department: 'Tecnología',
            photoURL: null,
            accountType: 'Usuario',
            lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            joinDate: '2024-06-01T00:00:00.000Z'
          }
        };

        if (knownUsers[emailUser]) {
          // Usuario conocido del sistema pero no en Firebase
          setUserPreview({
            email: emailValue,
            ...knownUsers[emailUser],
            isRealUser: false,
            isActive: true
          });
        } else {
          // Usuario completamente desconocido - mostrar alerta
          setUserPreview({
            email: emailValue,
            name: null,
            position: null,
            department: null,
            photoURL: null,
            accountType: null,
            lastLogin: null,
            joinDate: null,
            isRealUser: false,
            isActive: false,
            isUnregistered: true // Flag para identificar usuario no registrado
          });
        }
      }
    } catch (error) {
      console.error('❌ Error verificando email:', error);
      setUserPreview(null);
    } finally {
      setEmailCheckLoading(false);
      setShowSkeleton(false);
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
      // ✅ Navegar al dashboard después del login exitoso
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error en login:', err);
      
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          setError('Correo o contraseña incorrectos. Verifica tus credenciales.');
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
        case 'auth/network-request-failed':
          setError('Error de red. Verifica tu conexión a internet.');
          break;
        default:
          setError(`Error al iniciar sesión: ${err.message || 'Verifica tus credenciales.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      overflow: 'hidden',
      background: theme.palette.background.default
    }}>
      {/* 🎨 LEFT PANEL - SPECTACULAR BRANDING (60%) */}
      {!isMobile && (
        <Box sx={{
          flex: '1.5',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b'} 0%, ${theme.palette.mode === 'dark' ? '#020617' : '#0f172a'} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 8
        }}>
          {/* Aurora Background Effects */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.6,
            background: `
              radial-gradient(circle at 20% 20%, ${primaryColor}40 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${secondaryColor}40 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, ${primaryColor}20 0%, transparent 70%)
            `,
            filter: 'blur(60px)',
            animation: animationsEnabled ? 'auroraFlow 20s infinite alternate' : 'none',
            '@keyframes auroraFlow': {
              '0%': { transform: 'scale(1)' },
              '100%': { transform: 'scale(1.1)' }
            }
          }} />

          {/* Mesh Overlay */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(${primaryColor}20 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.2
          }} />

          {/* Floating 3D Elements */}
          {animationsEnabled && (
            <>
              <Box sx={{
                position: 'absolute',
                top: '20%',
                right: '20%',
                width: 120,
                height: 120,
                borderRadius: '30px',
                background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${primaryColor}60`,
                boxShadow: `0 8px 32px ${primaryColor}30`,
                animation: 'float1 8s ease-in-out infinite',
                '@keyframes float1': {
                  '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                  '50%': { transform: 'translateY(-20px) rotate(5deg)' }
                }
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: '20%',
                left: '15%',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${secondaryColor}30, ${primaryColor}30)`,
                backdropFilter: 'blur(30px)',
                border: `1px solid ${secondaryColor}50`,
                boxShadow: `0 8px 32px ${secondaryColor}30`,
                animation: 'float2 10s ease-in-out infinite 1s',
                '@keyframes float2': {
                  '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                  '50%': { transform: 'translateY(30px) rotate(-10deg)' }
                }
              }} />
            </>
          )}

          {/* Main Typography */}
          <Box sx={{ 
            position: 'relative', 
            zIndex: 10, 
            textAlign: 'center',
            animation: 'fadeInUp 800ms ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(30px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}>
            <Box sx={{ 
              mb: 3,
              '@keyframes heartbeat': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.02)' }
              },
              animation: animationsEnabled ? 'heartbeat 3s ease-in-out infinite' : 'none',
              animationDelay: '1s'
            }}>
              <DrGroupLogo size="large" showSubtitle={false} />
            </Box>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 400, 
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              mt: 2
            }}>
              Centro de Control Empresarial
            </Typography>
          </Box>
        </Box>
      )}

      {/* 📝 RIGHT PANEL - LOGIN FORM (40%) */}
      <Box sx={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 3, md: 6 },
        background: theme.palette.background.paper,
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            width: '100%', 
            maxWidth: 500, 
            px: 4,
            animation: 'fadeInScale 400ms ease-out',
            '@keyframes fadeInScale': {
              from: { opacity: 0, transform: 'scale(0.95)' },
              to: { opacity: 1, transform: 'scale(1)' }
            }
          }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <CircularProgress 
                size={48} 
                sx={{ 
                  color: primaryColor, 
                  mb: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.8, transform: 'scale(1.05)' }
                  }
                }} 
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  mb: 1,
                  animation: 'fadeIn 500ms ease-out 200ms both',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              >
                Iniciando sesión...
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  animation: 'fadeIn 500ms ease-out 400ms both'
                }}
              >
                Cargando tu espacio de trabajo
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              animation: 'slideUp 500ms ease-out 300ms both',
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
              <Skeleton 
                variant="rectangular" 
                height={60} 
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  '@keyframes shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                  }
                }} 
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton 
                  variant="rectangular" 
                  height={100} 
                  sx={{ 
                    borderRadius: 2, 
                    flex: 1,
                    background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite 0.1s'
                  }} 
                />
                <Skeleton 
                  variant="rectangular" 
                  height={100} 
                  sx={{ 
                    borderRadius: 2, 
                    flex: 1,
                    background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite 0.2s'
                  }} 
                />
              </Box>
              <Skeleton 
                variant="rectangular" 
                height={120} 
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite 0.3s'
                }} 
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton 
                  variant="rectangular" 
                  height={80} 
                  sx={{ 
                    borderRadius: 2, 
                    flex: 1,
                    background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite 0.4s'
                  }} 
                />
                <Skeleton 
                  variant="rectangular" 
                  height={80} 
                  sx={{ 
                    borderRadius: 2, 
                    flex: 1,
                    background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite 0.5s'
                  }} 
                />
                <Skeleton 
                  variant="rectangular" 
                  height={80} 
                  sx={{ 
                    borderRadius: 2, 
                    flex: 1,
                    background: `linear-gradient(90deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(primaryColor, 0.15)} 50%, ${alpha(primaryColor, 0.08)} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite 0.6s'
                  }} 
                />
              </Box>
            </Box>
          </Box>
        ) : (
        <Container 
          maxWidth="xs"
          sx={{
            animation: 'fadeInRight 600ms ease-out',
            '@keyframes fadeInRight': {
              from: { opacity: 0, transform: 'translateX(20px)' },
              to: { opacity: 1, transform: 'translateX(0)' }
            }
          }}
        >
            <Box sx={{ 
              mb: 6, 
              textAlign: isMobile ? 'center' : 'left',
              overflow: 'hidden'
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1, 
                  color: theme.palette.text.primary,
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: userPreview && !userPreview.isUnregistered ? 'bounceIn 500ms ease-out' : 'none',
                  '@keyframes bounceIn': {
                    '0%': { opacity: 0, transform: 'scale(0.9) translateY(-10px)' },
                    '60%': { opacity: 1, transform: 'scale(1.02) translateY(0)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                {userPreview && !userPreview.isUnregistered
                  ? `¡Hola de nuevo, ${userPreview.name?.split(' ')[0] || 'Usuario'}!`
                  : 'Bienvenido de nuevo'}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: userPreview && !userPreview.isUnregistered ? 'fadeInUp 500ms ease-out 100ms both' : 'none',
                  '@keyframes fadeInUp': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              >
                {userPreview && !userPreview.isUnregistered
                  ? 'Nos alegra verte por aquí.'
                  : 'Ingresa tus credenciales para acceder al panel.'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* User Preview Section (Preserved Logic) */}
              {showSkeleton && (
                <Box sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  animation: 'fadeIn 300ms ease-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(-10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              )}

              {userPreview && !userPreview.isUnregistered && !showSkeleton && (
                <Box sx={{
                  animation: 'fadeIn 300ms ease-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(-10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }}>
                    <Paper elevation={0} sx={{ 
                      mb: 3, 
                      p: 2, 
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.background.default,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Avatar 
                        src={userPreview.photoURL} 
                        sx={{ 
                          width: 48, 
                          height: 48,
                          bgcolor: primaryColor,
                          fontWeight: 700
                        }}
                      >
                        {!userPreview.photoURL && userPreview.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {userPreview.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {userPreview.position}
                        </Typography>
                      </Box>
                      {userPreview.isRealUser && (
                        <Verified sx={{ color: theme.palette.success.main, ml: 'auto' }} />
                      )}
                    </Paper>
                  </Box>
                )}

              {userPreview && userPreview.isUnregistered && !showSkeleton && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 3,
                    animation: 'fadeIn 300ms ease-out'
                  }}
                >
                  Usuario no registrado en el sistema.
                </Alert>
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
                      {emailCheckLoading ? <CircularProgress size={20} /> : <Email color="action" />}
                    </InputAdornment>
                  ),
                }}
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
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 8px 20px ${primaryColor}40`,
                  '&:hover': {
                    boxShadow: `0 12px 24px ${primaryColor}50`,
                  }
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
              </Button>

              {/* Admin Setup Link */}
              {!checkingAdmins && !hasAdmins && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="text" 
                    color="info" 
                    onClick={() => navigate('/admin-setup')}
                    startIcon={<AutoAwesome />}
                  >
                    Configurar Primer Administrador
                  </Button>
                </Box>
              )}
            </Box>
        </Container>
        )}
      </Box>
    </Box>
  );
};

export default LoginForm;
