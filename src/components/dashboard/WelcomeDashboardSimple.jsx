import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useContractExpirationAlerts } from '../../hooks/useContractExpirationAlerts';
import DashboardCalendar from './DashboardCalendar';
import QuickAccessLinks from './QuickAccessLinks';

const WelcomeDashboardSimple = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  useContractExpirationAlerts(); // ✅ Activar sistema de alertas de contratos
  const [currentTime] = useState(new Date().getHours());

  // Dashboard minimalista: Funciones de cálculo de compromisos vencidos eliminadas

  const getGreeting = () => {
    if (currentTime < 12) return 'Buenos días';
    if (currentTime < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Dashboard minimalista: Solo accesos rápidos y calendario
  // (Estadísticas eliminadas - redundantes con páginas dedicadas)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* 🎨 Header sobrio empresarial */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          p: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  mb: 0.5,
                  color: 'white',
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' }
                }}
              >
                {getGreeting()}, {userProfile?.name || userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.85)',
                  mb: 0
                }}
              >
                Centro de Comando Empresarial • Gestión financiera inteligente
              </Typography>
            </Box>
            
            {/* Botón sobrio con estado en tiempo real */}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={stats?.loading}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
                fontWeight: 500,
                px: 2.5,
                py: 1,
                color: 'white',
                textTransform: 'none',
                fontSize: '0.875rem',
                minHeight: 'auto',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              {stats?.loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Box>
        </Box>
      </motion.div>

        {/* Estadísticas eliminadas - Dashboard minimalista enfocado en accesos rápidos */}
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Páginas de Interés - Accesos Directos */}
        <Box sx={{ mb: 4 }}>
          <QuickAccessLinks />
        </Box>

        {/* Calendario de Compromisos y Festivos */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <DashboardCalendar />
          </motion.div>
        </Box>


      </Box>

      {/* Modal de alertas eliminado - Sistema centralizado en AlertsCenter */}
    </motion.div>
  );
};

export default WelcomeDashboardSimple;
