import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { motion } from 'framer-motion';

const GlobalLoader = ({ loading, message = "Cargando..." }) => {
  if (!loading) return null;

  return (
    <Fade in={loading}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress 
            size={80} 
            thickness={4}
            sx={{ 
              color: 'white',
              mb: 3,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 1
            }}
          >
            {message}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              textAlign: 'center' 
            }}
          >
            Preparando el Centro de Comando Empresarial...
          </Typography>
        </motion.div>

        {/* Animación de puntos de carga */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ marginTop: '2rem' }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
            ))}
          </Box>
        </motion.div>
      </Box>
    </Fade>
  );
};

export default GlobalLoader;
