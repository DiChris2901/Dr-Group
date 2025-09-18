import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Launch,
  Business,
  AccountBalance,
  Assignment,
  Description,
  LocalAtm,
  HealthAndSafety
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const QuickAccessLinks = () => {
  const theme = useTheme();

  const quickLinks = [
    {
      id: 1,
      title: 'Portal Operativo',
      subtitle: 'Sistema principal de operaciones',
      url: 'https://www.organizacionrdj.com',
      icon: Business,
      delay: 0
    },
    {
      id: 2,
      title: 'Coljuegos',
      subtitle: 'Portal oficial gubernamental',
      url: 'https://www.coljuegos.gov.co',
      icon: AccountBalance,
      delay: 0.1
    },
    {
      id: 3,
      title: 'Portal del Operador',
      subtitle: 'Trámites ágiles Coljuegos',
      url: 'https://tramiteagil.coljuegos.gov.co/PortalOperador/Coljuegos/index.xhtml',
      icon: Assignment,
      delay: 0.2
    },
    {
      id: 4,
      title: 'HOUNDOC',
      subtitle: 'Plataforma inteligente JSA',
      url: 'https://app.ia.coljuegos.gov.co/login?p=/',
      icon: Description,
      delay: 0.3
    },
    {
      id: 5,
      title: 'Muisca DIAN',
      subtitle: 'Sistema tributario nacional',
      url: 'https://muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=eyJjbGllbnRJZCI6IldvMGFLQWxCN3ZSUF8xNmZyUEkxeDlacGhCRWEiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbXVpc2NhLmRpYW4uZ292LmNvL0lkZW50aWRhZFJlc3RfTG9naW5GaWx0cm8vYXBpL3N0cy92MS9hdXRoL2NhbGxiYWNrP3JlZGlyZWN0X3VyaT1odHRwJTNBJTJGJTJGbXVpc2NhLmRpYW4uZ292LmNvJTJGV2ViQXJxdWl0ZWN0dXJhJTJGRGVmTG9naW4uZmFjZXMiLCJyZXNwb25zZVR5cGUiOiIiLCJzY29wZSI6IiIsInN0YXRlIjoiIiwibm9uY2UiOiIiLCJwYXJhbXMiOnsidGlwb1VzdWFyaW8iOiJtdWlzY2EifX0%3D',
      icon: LocalAtm,
      delay: 0.4
    },
    {
      id: 6,
      title: 'SuperSalud',
      subtitle: 'Superintendencia de Salud',
      url: 'https://b2csupersalud.b2clogin.com/fde7cdd3-9370-4490-b315-57832145013a/b2c_1_flujoregistroiniciosesion/oauth2/v2.0/authorize?client_id=e23d6426-30f1-4866-a797-6ed7ddb8089f&redirect_uri=https%3A%2F%2Fgenesis.supersalud.gov.co%2Fsignin-oidc&response_type=id_token&scope=openid%20profile&response_mode=form_post&nonce=638887962152960111.YzdhY2QzZWEtMDAzYy00ODFmLWI4Y2QtYWYyMTc1YjFiMjg2OGRhM2NlOWYtNGFiOC00NWVkLWFlNGQtZDUzZTFjYjE3NjEw&state=CfDJ8MfFcOGZZ7lHsmJHkd_eXvjuIuiWf47YLURdXVhg6KMM1oHoijRv4EwqZp_O4ik34j4ksMr7YZUy6JUfK0zBqEtonpoBUOjwYMz-4QOwD9EIIsjSfS8dq0Fn1NmclaWVKXHEvqobxPPKeGMjFJqK2hXfTA375uF2ZEeMb0iJ4nPbbsAFo_bmrkAhuxoh70jgfIl9uRwmN_ubfvc46VHg1m2DnEp_J6h6NKeF9hoKBfsAj2Yqy_f8GhkypKCzvKUzcBpMkIYZTJAhtbusO1qCo2fKF8ZQV9FwaLhPXXfwxM0WdKb_to_vlAoLsh40VqBbivbsQwmfSgix1KxrbRf7uonCRpuB7ED2CWDNBvrjDBjC&x-client-SKU=ID_NETSTANDARD2_0&x-client-ver=5.3.0.0',
      icon: HealthAndSafety,
      delay: 0.5
    }
  ];

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card sx={{ 
        p: 3,
        background: theme.palette.mode === 'dark' 
          ? theme.palette.background.paper
          : '#ffffff',
        border: `0.6px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)}`,
        boxShadow: 'none',
        overflow: 'visible'
      }}>
        <Typography 
          variant="h6" 
          fontWeight={600} 
          sx={{ 
            mb: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: 'text.primary',
            textAlign: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem'
          }}
        >
          <Launch sx={{ color: 'primary.main', fontSize: 20 }} />
          Páginas de Interés - Accesos Directos
        </Typography>
        
        <Grid container spacing={2}>
          {quickLinks.map((link) => (
            <Grid item xs={12} sm={6} md={4} key={link.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: link.delay,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    background: theme.palette.mode === 'dark' 
                      ? theme.palette.background.paper
                      : '#ffffff',
                    color: theme.palette.text.primary,
                    border: `0.6px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.12)}`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}, 0 2px 8px rgba(0, 0, 0, 0.2)`
                      : `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}, 0 2px 8px rgba(0, 0, 0, 0.04)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}, 0 4px 12px rgba(0, 0, 0, 0.3)`
                        : `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}, 0 4px 12px rgba(0, 0, 0, 0.08)`,
                      transform: 'translateY(-2px)',
                      background: theme.palette.mode === 'dark' 
                        ? theme.palette.background.paper
                        : '#ffffff'
                    }
                  }}
                  onClick={() => handleLinkClick(link.url)}
                >
                  <CardContent sx={{ 
                    p: 2.5, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 1.5
                      }}>
                        <link.icon sx={{ 
                          fontSize: 26, 
                          color: 'primary.main',
                          opacity: 0.9,
                          transition: 'all 0.2s ease',
                          filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.2)})`
                        }} />
                        <Tooltip title="Abrir en nueva pestaña">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: 'primary.main',
                              opacity: 0.7,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                opacity: 1,
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Launch fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        fontWeight={600}
                        sx={{ 
                          mb: 0.5,
                          fontSize: '0.95rem',
                          lineHeight: 1.2,
                          color: 'text.primary',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        {link.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                          opacity: 0.8
                        }}
                      >
                        {link.subtitle}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ 
          mt: 1.5, 
          textAlign: 'center'
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Haz clic en cualquier tarjeta para abrir el portal en una nueva pestaña
          </Typography>
        </Box>
      </Card>
    </motion.div>
  );
};

export default QuickAccessLinks;