import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

const DrGroupLogo = ({ 
  size = 'medium', 
  variant = 'full', 
  animated = true,
  showSubtitle = false,
  useSvg = true // 🎨 Default to SVG for the new Infinity Flow design
}) => {
  const theme = useTheme();
  const { settings } = useSettings();
  
  // 🎨 Design System Spectacular - Colores dinámicos
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const animationsEnabled = settings?.theme?.animations !== false && animated;
  const compactMode = settings?.sidebar?.compactMode || false;

  // Tamaños responsive
  const sizes = {
    small: {
      drFont: compactMode ? '1.2rem' : '1.4rem',
      groupFont: compactMode ? '0.7rem' : '0.8rem',
      subtitleFont: compactMode ? '0.6rem' : '0.7rem',
      spacing: 1
    },
    medium: {
      drFont: compactMode ? '1.6rem' : '1.8rem',
      groupFont: compactMode ? '0.8rem' : '0.9rem',
      subtitleFont: compactMode ? '0.7rem' : '0.75rem',
      spacing: 1.5
    },
    large: {
      drFont: compactMode ? '2rem' : '2.2rem',
      groupFont: compactMode ? '1rem' : '1.1rem',
      subtitleFont: compactMode ? '0.8rem' : '0.85rem',
      spacing: 2
    }
  };

  const currentSize = sizes[size] || sizes.medium;

  const MotionBox = animationsEnabled ? motion.div : Box;

  // 🎨 Renderizado SVG spectacular
  if (useSvg) {
    const svgSizes = {
      small: { width: 120, height: 40 },
      medium: { width: 180, height: 60 },
      large: { width: 240, height: 80 }
    };

    const currentSvgSize = svgSizes[size] || svgSizes.medium;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', overflow: 'visible' }}>
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
            viewBox="0 0 180 40"
            preserveAspectRatio="xMidYMid meet"
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
            {/* Background con efecto glass sutil */}
            <rect 
              width="180" 
              height="40" 
              rx="8" 
              fill="rgba(255,255,255,0.03)"
            />
            
            {/* Icon/Symbol - Infinity Flow (Left Side) */}
            <g transform="translate(35, 0)">
               {/* Glow effect */}
               <path 
                 d="M 5 20 C 5 10, 20 10, 20 20 C 20 30, 35 30, 35 20" 
                 fill="none" 
                 stroke="url(#infinityGradient)" 
                 strokeWidth="4" 
                 strokeLinecap="round"
                 filter="url(#glow)"
                 opacity="0.6"
               />
               {/* Main path */}
               <path 
                 d="M 5 20 C 5 10, 20 10, 20 20 C 20 30, 35 30, 35 20" 
                 fill="none" 
                 stroke="url(#infinityGradient)" 
                 strokeWidth="3" 
                 strokeLinecap="round"
               />
               <circle cx="35" cy="20" r="3" fill="#fbbf24" filter="url(#glow)" />
            </g>
            
            {/* RDJ Text (Right Side) */}
            <text 
              x="80" 
              y="26" 
              fontFamily="'Segoe UI', Arial, sans-serif" 
              fontSize="18" 
              fontWeight="700" 
              fill="white"
              letterSpacing="-0.5px"
            >
              RDJ
            </text>
            
            {/* Definiciones spectacular */}
            <defs>
              <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
              </linearGradient>
              
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {animationsEnabled && (
                <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
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
            
            {animationsEnabled && (
              <rect width="120" height="40" rx="8" fill="url(#shimmerGradient)" opacity="0.5"/>
            )}
          </Box>
        </MotionBox>

      </Box>
    );
  }

  return (
    <MotionBox
      initial={animationsEnabled ? { opacity: 0, scale: 0.95 } : {}}
      animate={animationsEnabled ? { opacity: 1, scale: 1 } : {}}
      transition={animationsEnabled ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : {}}
      whileHover={animationsEnabled ? { scale: 1.02 } : {}}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: currentSize.spacing,
          cursor: 'pointer',
          position: 'relative',
          transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
      >
        {/* Monograma "DR" con gradiente spectacular */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            '&::before': animationsEnabled ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(45deg, transparent 30%, ${primaryColor}10 50%, transparent 70%)`,
              animation: 'shimmer 3s infinite',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            } : {}
          }}
        >
          <Typography
            variant="h1"
            component="span"
            sx={{
              fontSize: currentSize.drFont,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              position: 'relative',
              zIndex: 1,
              transition: animationsEnabled ? 'all 0.3s ease' : 'none'
            }}
          >
              RDJ
          </Typography>
        </Box>

        {/* Texto "GROUP" solo si variant es 'full' */}
        {variant === 'full' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontSize: currentSize.groupFont,
                fontWeight: 600,
                color: theme.palette.text.primary,
                letterSpacing: '0.1em',
                lineHeight: 1,
                textTransform: 'uppercase',
                opacity: 0.9
              }}
            >
              ORGANIZACIÓN RDJ
            </Typography>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default DrGroupLogo;
