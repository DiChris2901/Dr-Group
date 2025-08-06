import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useSettings } from '../../context/SettingsContext';

const DrGroupLogoSvg = ({ 
  size = 'medium', 
  variant = 'full', 
  animated = true,
  showText = true,
  sx = {},
  ...rest
}) => {
  const theme = useTheme();
  const { settings } = useSettings();
  
  // 🎨 Design System Spectacular - Colores dinámicos
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const animationsEnabled = settings?.theme?.animations !== false && animated;

  // Tamaños responsive para el SVG
  const svgSizes = {
    small: { width: 80, height: 32 },
    medium: { width: 120, height: 40 },
    large: { width: 160, height: 56 }
  };

  const currentSvgSize = svgSizes[size] || svgSizes.medium;

  const MotionBox = animationsEnabled ? motion.div : Box;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        ...sx
      }}
      {...rest}
    >
      {/* SVG Logo con efectos spectacular */}
      <MotionBox
        initial={animationsEnabled ? { opacity: 0, scale: 0.8 } : {}}
        animate={animationsEnabled ? { opacity: 1, scale: 1 } : {}}
        transition={animationsEnabled ? { duration: 0.6, ease: "easeOut" } : {}}
        whileHover={animationsEnabled ? { scale: 1.05, rotateY: 5 } : {}}
      >
        <Box
          component="svg"
          width={currentSvgSize.width}
          height={currentSvgSize.height}
          viewBox="0 0 120 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          sx={{
            filter: variant === 'dark' ? 'brightness(0.9)' : 'none',
            transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            '&:hover': animationsEnabled ? {
              filter: 'drop-shadow(0 8px 25px rgba(0,0,0,0.15))'
            } : {}
          }}
        >
          {/* Background con gradiente dinámico spectacular */}
          <rect 
            width="120" 
            height="40" 
            rx="8" 
            fill="url(#drGroupGradient)"
            style={{
              transition: animationsEnabled ? 'all 0.3s ease' : 'none'
            }}
          />
          
          {/* DR Text con mejor tipografía */}
          <text 
            x="12" 
            y="28" 
            fontFamily="'Segoe UI', Arial, sans-serif" 
            fontSize="18" 
            fontWeight="800" 
            fill="white"
            letterSpacing="-0.5px"
          >
            DR
          </text>
          
          {/* Group Text con elegancia */}
          <text 
            x="40" 
            y="28" 
            fontFamily="'Segoe UI', Arial, sans-serif" 
            fontSize="13" 
            fontWeight="600" 
            fill="rgba(255,255,255,0.92)"
            letterSpacing="1px"
          >
            GROUP
          </text>
          
          {/* Icon/Symbol con efectos spectacular */}
          <g transform="translate(85, 15)">
            {/* Anillo exterior */}
            <circle 
              cx="5" 
              cy="5" 
              r="12" 
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            
            {/* Anillo medio */}
            <circle 
              cx="5" 
              cy="5" 
              r="8" 
              fill="rgba(255,255,255,0.25)"
            />
            
            {/* Centro brillante */}
            <circle 
              cx="5" 
              cy="5" 
              r="4" 
              fill="white"
              filter="url(#innerGlow)"
            />
            
            {/* Pequeño detalle central */}
            <circle 
              cx="5" 
              cy="5" 
              r="1.5" 
              fill={primaryColor}
              opacity="0.8"
            />
          </g>
          
          {/* Definiciones de gradientes y efectos */}
          <defs>
            {/* Gradiente principal spectacular */}
            <linearGradient id="drGroupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
              <stop offset="50%" stopColor={`${primaryColor}CC`} stopOpacity="1" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
            </linearGradient>
            
            {/* Resplandor interior */}
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Efecto shimmer si está habilitado */}
            {animationsEnabled && (
              <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="transparent" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-120 0; 120 0; -120 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </linearGradient>
            )}
          </defs>
          
          {/* Overlay shimmer effect */}
          {animationsEnabled && (
            <rect 
              width="120" 
              height="40" 
              rx="8" 
              fill="url(#shimmerGradient)"
              opacity="0.6"
            />
          )}
        </Box>
      </MotionBox>

      {/* Texto complementario (opcional) */}
      {showText && variant === 'full' && (
        <MotionBox
          initial={animationsEnabled ? { opacity: 0, x: -20 } : {}}
          animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
          transition={animationsEnabled ? { duration: 0.6, delay: 0.2 } : {}}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontSize: size === 'small' ? '0.8rem' : size === 'medium' ? '0.9rem' : '1.1rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                letterSpacing: '0.1em',
                lineHeight: 1,
                textTransform: 'uppercase',
                opacity: 0.9
              }}
            >
              CORPORATE
            </Typography>
            
            <Typography
              variant="caption"
              component="span"
              sx={{
                fontSize: size === 'small' ? '0.6rem' : size === 'medium' ? '0.7rem' : '0.8rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                letterSpacing: '0.05em',
                lineHeight: 1,
                opacity: 0.7,
                textTransform: 'capitalize'
              }}
            >
              Financial Management
            </Typography>
          </Box>
        </MotionBox>
      )}
    </Box>
  );
};

export default DrGroupLogoSvg;
