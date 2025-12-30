import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * ModuleCard - Card accionable para navegación del Module Hub
 * Diseño Sobrio: borderRadius 2, sombras sutiles, alpha borders
 */
const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  stats = [], 
  onClick,
  color = 'primary',
  disabled = false
}) => {
  const theme = useTheme();
  const mainColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Paper
        elevation={0}
        onClick={disabled ? null : onClick}
        sx={{
          p: 3,
          height: '100%',
          minHeight: 240,
          borderRadius: 2, // ✅ 16px - Diseño Sobrio
          border: `1px solid ${alpha(mainColor, 0.2)}`, // ✅ Alpha 0.2
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // ✅ Sombra Nivel 1
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.2s ease', // ✅ Transición sobria
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': disabled ? {} : {
            borderColor: alpha(mainColor, 0.6), // ✅ Alpha 0.6 en hover
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // ✅ Sombra Nivel 2
            '& .module-icon': {
              transform: 'scale(1.05)',
              color: mainColor
            },
            '& .action-button': {
              color: mainColor,
              backgroundColor: alpha(mainColor, 0.08)
            }
          }
        }}
      >
        {/* ÍCONO Y TÍTULO */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              className="module-icon"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5, // ✅ 12px para iconos
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(mainColor, 0.1),
                border: `1px solid ${alpha(mainColor, 0.2)}`,
                color: alpha(mainColor, 0.8),
                transition: 'all 0.2s ease'
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, // ✅ NO usar 700+ en sobrio
                  color: theme.palette.text.primary,
                  mb: 0.25
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.7),
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.7rem'
                }}
              >
                {description}
              </Typography>
            </Box>
          </Box>

          {/* ESTADÍSTICAS */}
          {stats.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {stats.map((stat, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1,
                    mb: 1
                  }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600,
                      color: mainColor,
                      lineHeight: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* BOTÓN DE ACCIÓN */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            className="action-button"
            variant="text"
            endIcon={<ArrowForwardIcon />}
            disabled={disabled}
            sx={{
              borderRadius: 1, // ✅ 8px para botones
              textTransform: 'none',
              fontWeight: 500,
              color: alpha(theme.palette.text.secondary, 0.8),
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(mainColor, 0.04) // ✅ Hover sutil
              }
            }}
          >
            {disabled ? 'Próximamente' : 'Ver más'}
          </Button>
        </Box>

        {/* BADGE DE ESTADO (Opcional) */}
        {disabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.warning.main,
                fontWeight: 600,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              En Desarrollo
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default ModuleCard;
