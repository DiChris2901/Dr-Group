/**
 * Professional Settings Button
 * Floating action button for theme configuration
 */

import React from 'react';
import { Fab, Tooltip, Badge, useTheme, alpha } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

export function SettingsButton({ onClick }) {
  const theme = useTheme();
  const { settings } = useSettings();
  
  const hasCustomizations = settings.primaryColor !== 'default' || 
                           settings.mode !== 'light' || 
                           settings.compactMode;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.5 
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1200,
      }}
    >
      <Tooltip 
        title="Configuración del Tema" 
        arrow 
        placement="left"
      >
        <Badge
          color="primary"
          variant="dot"
          invisible={!hasCustomizations}
          sx={{
            '& .MuiBadge-dot': {
              animation: hasCustomizations ? 'pulse 2s infinite' : 'none',
            },
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(0.95)',
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`,
              },
              '70%': {
                transform: 'scale(1)',
                boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}`,
              },
              '100%': {
                transform: 'scale(0.95)',
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
              },
            },
          }}
        >
          <Fab
            color="primary"
            onClick={onClick}
            sx={{
              width: 56,
              height: 56,
              background: hasCustomizations 
                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : theme.palette.primary.main,
              boxShadow: theme.shadows[8],
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[12],
              },
            }}
          >
            <Settings 
              sx={{ 
                color: 'white',
                fontSize: 24,
                animation: hasCustomizations ? 'spin 3s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} 
            />
          </Fab>
        </Badge>
      </Tooltip>
    </motion.div>
  );
}

export default SettingsButton;
