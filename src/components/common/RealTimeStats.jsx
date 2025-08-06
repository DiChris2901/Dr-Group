import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Timeline, 
  TrendingUp, 
  Business, 
  AttachMoney,
  Speed,
  Security
} from '@mui/icons-material';

const RealTimeStats = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    systemLoad: 0,
    activeUsers: 0,
    processingTime: 0,
    securityStatus: 'OK',
    lastUpdate: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        systemLoad: Math.floor(Math.random() * 30) + 15, // 15-45%
        activeUsers: Math.floor(Math.random() * 8) + 3, // 3-10 usuarios
        processingTime: Math.floor(Math.random() * 150) + 50, // 50-200ms
        securityStatus: Math.random() > 0.1 ? 'OK' : 'ALERT',
        lastUpdate: new Date().toLocaleTimeString()
      });
    };

    // Actualizar cada 5 segundos
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Llamada inicial

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return '#4caf50';
      case 'ALERT': return '#f44336';
      default: return '#ff9800';
    }
  };

  const statsItems = [
    {
      icon: <Speed fontSize="small" />,
      label: 'Carga del Sistema',
      value: `${stats.systemLoad}%`,
      color: stats.systemLoad > 35 ? '#f44336' : '#4caf50'
    },
    {
      icon: <Business fontSize="small" />,
      label: 'Usuarios Activos',
      value: stats.activeUsers,
      color: '#2196f3'
    },
    {
      icon: <Timeline fontSize="small" />,
      label: 'Tiempo de Proceso',
      value: `${stats.processingTime}ms`,
      color: stats.processingTime > 150 ? '#ff9800' : '#4caf50'
    },
    {
      icon: <Security fontSize="small" />,
      label: 'Seguridad',
      value: stats.securityStatus,
      color: getStatusColor(stats.securityStatus)
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          p: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.8))',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 4px 16px rgba(31, 38, 135, 0.2)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {statsItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: item.color, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {item.label}:
              </Typography>
              <Chip
                label={item.value}
                size="small"
                sx={{
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  background: `${item.color}20`,
                  color: item.color,
                  border: `1px solid ${item.color}30`,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            </Box>
          </motion.div>
        ))}
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Última actualización: {stats.lastUpdate}
          </Typography>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ marginLeft: '8px' }}
          >
            <Box
              sx={{
                width: '6px',
                height: '6px',
                backgroundColor: '#4caf50',
                borderRadius: '50%',
                opacity: 0.8
              }}
            />
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
};

export default RealTimeStats;
