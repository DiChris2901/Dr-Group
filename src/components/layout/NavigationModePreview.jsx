import React from 'react';
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';
import {
  Dashboard as SidebarIcon,
  GridView as TaskbarIcon,
  DashboardCustomize as BothIcon
} from '@mui/icons-material';

/**
 * Visual preview component for navigation modes
 * Shows a miniature representation of each mode
 */
const NavigationModePreview = ({ mode = 'sidebar' }) => {
  const theme = useTheme();

  const getModeConfig = () => {
    switch (mode) {
      case 'sidebar':
        return {
          icon: SidebarIcon,
          color: theme.palette.primary.main,
          title: 'Sidebar Tradicional',
          description: 'Navegación lateral clásica con menú expandible',
          preview: (
            <Box sx={{ display: 'flex', width: '100%', height: 80, gap: 0.5 }}>
              {/* Sidebar */}
              <Box sx={{ 
                width: '25%', 
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: 1,
                border: `2px solid ${theme.palette.primary.main}`
              }} />
              {/* Content */}
              <Box sx={{ 
                flex: 1, 
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 1,
                border: `1px dashed ${theme.palette.divider}`
              }} />
            </Box>
          )
        };
      case 'taskbar':
        return {
          icon: TaskbarIcon,
          color: '#FF5722',
          title: 'Taskbar Horizontal',
          description: 'Barra inferior estilo Windows con acceso rápido',
          preview: (
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: 80, gap: 0.5 }}>
              {/* Content */}
              <Box sx={{ 
                flex: 1, 
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 1,
                border: `1px dashed ${theme.palette.divider}`
              }} />
              {/* Taskbar */}
              <Box sx={{ 
                height: '30%', 
                bgcolor: alpha('#FF5722', 0.15),
                borderRadius: 1,
                border: `2px solid #FF5722`
              }} />
            </Box>
          )
        };
      case 'both':
        return {
          icon: BothIcon,
          color: '#9C27B0',
          title: 'Sistema Triple Completo',
          description: 'Sidebar + Taskbar para máxima productividad',
          preview: (
            <Box sx={{ display: 'flex', width: '100%', height: 80, gap: 0.5 }}>
              {/* Sidebar */}
              <Box sx={{ 
                width: '25%', 
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: 1,
                border: `2px solid ${theme.palette.primary.main}`
              }} />
              {/* Content + Taskbar */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ 
                  flex: 1, 
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderRadius: 1,
                  border: `1px dashed ${theme.palette.divider}`
                }} />
                <Box sx={{ 
                  height: '30%', 
                  bgcolor: alpha('#9C27B0', 0.15),
                  borderRadius: 1,
                  border: `2px solid #9C27B0`
                }} />
              </Box>
            </Box>
          )
        };
      default:
        return null;
    }
  };

  const config = getModeConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: config.color,
          bgcolor: alpha(config.color, 0.05),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${alpha(config.color, 0.15)}`
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: alpha(config.color, 0.15),
            color: config.color,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {config.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {config.description}
          </Typography>
        </Box>
      </Box>

      {/* Visual Preview */}
      {config.preview}
    </Paper>
  );
};

export default NavigationModePreview;
