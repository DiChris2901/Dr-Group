import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Block as BlockIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/**
 * UnauthorizedPage - Página de acceso denegado (403 Forbidden)
 * 
 * Muestra cuando un usuario intenta acceder a una ruta protegida sin los permisos necesarios.
 * Diseño sobrio empresarial siguiendo DISENO_SOBRIO_NOTAS.md
 */
const UnauthorizedPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();

  // Obtener información del permiso requerido desde el state de navegación
  const requiredPermission = location.state?.requiredPermission || 'desconocido';
  const fromPath = location.state?.from || '/dashboard';

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 600,
            p: 5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.08)}`
          }}
        >
          {/* Ícono de acceso denegado */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`
              }}
            >
              <BlockIcon
                sx={{
                  fontSize: 64,
                  color: theme.palette.error.main
                }}
              />
            </Box>
          </Box>

          {/* Título */}
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.error.main,
              mb: 1
            }}
          >
            Acceso Denegado
          </Typography>

          {/* Código de error */}
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 3, fontWeight: 500 }}
          >
            Error 403 - Forbidden
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Mensaje principal */}
          <Alert
            severity="error"
            icon={<VpnKeyIcon />}
            sx={{
              mb: 3,
              borderRadius: 1,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              No tienes permisos para acceder a este recurso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta no cuenta con los permisos necesarios para visualizar esta página.
            </Typography>
          </Alert>

          {/* Información del permiso requerido */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mb: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 1
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.8,
                color: 'text.secondary',
                display: 'block',
                mb: 1.5
              }}
            >
              DETALLES DEL ACCESO
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Usuario actual */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Tu usuario:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {userProfile?.name || currentUser?.email || 'Usuario'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser?.email}
                </Typography>
              </Box>

              {/* Permiso requerido */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Permiso(s) requerido(s):
                </Typography>
                <Chip
                  label={requiredPermission}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: '0.8125rem'
                  }}
                />
              </Box>

              {/* Ruta intentada */}
              {fromPath && fromPath !== '/dashboard' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Ruta solicitada:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      color: 'text.secondary'
                    }}
                  >
                    {fromPath}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Información adicional */}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Si crees que deberías tener acceso a esta sección, contacta al administrador del sistema
            para solicitar los permisos necesarios.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Botones de acción */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                borderRadius: 1,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Ir al Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                borderRadius: 1,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Volver Atrás
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default UnauthorizedPage;
