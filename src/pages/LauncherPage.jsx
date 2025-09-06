import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  useTheme,
  alpha,
  Avatar,
  Stack,
  Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const LauncherPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const applications = [
    {
      id: 'dashboard',
      title: 'DR Group Dashboard',
      description: 'Sistema de gestión financiera empresarial',
      icon: DashboardIcon,
      route: '/login',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      available: true
    },
    {
      id: 'business',
      title: 'Business Suite',
      description: 'Próximamente - Suite empresarial completa',
      icon: BusinessIcon,
      route: null,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      available: false
    },
    {
      id: 'analytics',
      title: 'Analytics Pro',
      description: 'Próximamente - Análisis avanzado de datos',
      icon: AnalyticsIcon,
      route: null,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      available: false
    },
    {
      id: 'settings',
      title: 'System Center',
      description: 'Centro de configuración del sistema',
      icon: SettingsIcon,
      route: '/system-login',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      available: true
    }
  ];

  const handleCardClick = (app) => {
    if (app.available && app.route) {
      navigate(app.route);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        py: 6,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '2.8rem', md: '3.8rem' },
                color: 'white',
                mb: 1,
                letterSpacing: '-0.04em',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              DR Group
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ 
                fontWeight: 400,
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.65)',
                letterSpacing: '0.2px',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              Centro de Aplicaciones Empresariales
            </Typography>
          </Box>
        </motion.div>

        {/* Applications Grid */}
        <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '900px', mx: 'auto' }}>
          {applications.map((app, index) => (
            <Grid item xs={12} sm={6} md={3} key={app.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ 
                  scale: app.available ? 1.03 : 1,
                  y: app.available ? -2 : 0,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                whileTap={{ scale: app.available ? 0.98 : 1 }}
              >
                <Card
                  sx={{
                    height: 180,
                    background: app.available 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(51, 65, 85, 0.6)',
                    borderRadius: 2.5,
                    cursor: app.available ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    border: app.available 
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: app.available 
                      ? '0 8px 32px rgba(102, 126, 234, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'
                      : '0 4px 16px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '&:hover': app.available ? {
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15)'
                    } : {}
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCardClick(app)}
                    disabled={!app.available}
                    sx={{ 
                      height: '100%',
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 0, width: '100%' }}>
                      {/* Status Badge */}
                      {!app.available && (
                        <Chip
                          label="Próximamente"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 22,
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            letterSpacing: '0.3px',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                          }}
                        />
                      )}

                      {/* Icon */}
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          mb: 1.5,
                          background: app.available 
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: app.available ? 'white' : 'rgba(255, 255, 255, 0.4)',
                          backdropFilter: 'blur(10px)',
                          border: app.available 
                            ? '1px solid rgba(255, 255, 255, 0.2)'
                            : '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <app.icon sx={{ fontSize: 28 }} />
                      </Avatar>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: app.available ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.95rem',
                          mb: 0.5,
                          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3
                        }}
                      >
                        {app.title}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: app.available 
                            ? 'rgba(255, 255, 255, 0.75)'
                            : 'rgba(255, 255, 255, 0.35)',
                          fontSize: '0.8rem',
                          lineHeight: 1.4,
                          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          fontWeight: 400,
                          letterSpacing: '0.1px'
                        }}
                      >
                        {app.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Box textAlign="center" mt={6}>
            <Typography
              variant="body2"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.85rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                fontWeight: 400,
                letterSpacing: '0.2px'
              }}
            >
              © 2025 DR Group. Soluciones empresariales integradas.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LauncherPage;
