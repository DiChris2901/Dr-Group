/**
 * 🤖 Botón Flotante del Asistente
 * Botón siempre visible para abrir el chat
 */

import React from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Box,
  alpha,
  useTheme
} from '@mui/material';
import {
  AutoAwesome as GeminiIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AssistantButton = ({ onClick, hasNewSuggestions = false }) => {
  const theme = useTheme();

  return (
    <Tooltip 
      title="Asistente Inteligente" 
      placement="left"
      arrow
    >
      <Box
        component={motion.div}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        sx={{
          position: 'fixed',
          bottom: { xs: 160, md: 170 }, // Justo encima del botón de chat
          right: { xs: 16, md: 24 },
          zIndex: 1200 // Menor que el drawer (1300)
        }}
      >
        <Badge
          badgeContent={hasNewSuggestions ? '!' : 0}
          color="error"
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 1
                },
                '50%': {
                  transform: 'scale(1.2)',
                  opacity: 0.8
                }
              }
            }
          }}
        >
          <Fab
            color="primary"
            onClick={onClick}
            sx={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, #4285f4 0%, #9b51e0 50%, #ea4335 100%)`, // Colores de Gemini
              boxShadow: `0 8px 32px ${alpha('#4285f4', 0.4)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: `0 12px 48px ${alpha('#4285f4', 0.6)}`,
                transform: 'translateY(-4px)',
              },
              '& .MuiSvgIcon-root': {
                fontSize: 28
              }
            }}
          >
            <GeminiIcon />
          </Fab>
        </Badge>
      </Box>
    </Tooltip>
  );
};

export default AssistantButton;
