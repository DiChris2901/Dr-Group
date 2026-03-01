// 🎨 Organizaci�n RDJ Dashboard - Design System v2.0
// Sistema de diseño unificado siguiendo las especificaciones del DESIGN_SYSTEM.md

import { useTheme } from '@mui/material/styles';

// ========================================
// 🎯 GRADIENTES DINÁMICOS (DESIGN_SYSTEM.md Spec)
// ========================================

// Gradiente principal para banners y elementos hero
export const primaryGradient = (theme) => 
  `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`;

// Gradiente para papers y contenedores
export const paperGradient = (theme) => theme.palette.mode === 'dark'
  ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)';

// Gradiente para alerts y notificaciones
export const infoGradient = (theme) => 
  `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`;

// ========================================
// ✨ EFECTOS Y ANIMACIONES CSS (DESIGN_SYSTEM.md Spec)
// ========================================

// Efecto Shimmer (para elementos premium)
export const shimmerEffect = {
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 2s infinite',
    zIndex: 1
  },
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' }
  }
};

// Efecto Pulse (para elementos importantes)
export const pulseEffect = (theme) => ({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%, 100%': { 
      boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` 
    },
    '50%': { 
      boxShadow: `0 0 0 10px ${theme.palette.primary.main}00` 
    }
  }
});

// Efecto Float (para partículas decorativas)
export const floatEffect = {
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' }
  }
};

// ========================================
// 🪝 HOOKS PERSONALIZADOS (DESIGN_SYSTEM.md Spec)
// ========================================

// Hook para gradientes dinámicos
export const useThemeGradients = () => {
  const theme = useTheme();
  return {
    primary: primaryGradient(theme),
    paper: paperGradient(theme),
    info: infoGradient(theme)
  };
};

// ========================================
// 🎬 VARIANTES DE ANIMACIÓN (DESIGN_SYSTEM.md Spec)
// ========================================

// Variantes de animación estándar para Framer Motion
export const animationVariants = {
  // Entrada desde abajo
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  
  // Entrada con escala
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", bounce: 0.3, duration: 0.6 }
  },
  
  // Entrada lateral
  slideInLeft: {
    initial: { x: -30, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { delay: 0.3, duration: 0.5 }
  },

  // Micro-interacciones de botón
  buttonHover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", bounce: 0.4 }
  },

  // Para elementos que no deben moverse cuando disabled
  buttonHoverConditional: (disabled) => ({
    whileHover: { scale: disabled ? 1 : 1.02 },
    whileTap: { scale: disabled ? 1 : 0.98 },
    transition: { type: "spring", bounce: 0.4 }
  }),

  // Rotación continua (iconos de carga)
  spinning: {
    animate: { rotate: 360 },
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  },

  // Rotación con escala (elementos especiales)
  spinScale: {
    animate: { 
      rotate: [0, 360],
      scale: [1, 1.1, 1]
    },
    transition: { 
      rotate: { duration: 10, repeat: Infinity, ease: "linear" },
      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  },

  // Modal aparición optimizada - Sin lag v2.0
  modalAppear: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { 
      type: "tween", 
      duration: 0.15,
      ease: "easeOut"
    }
  },

  // Modal aparición para contenido (con delay stagger)
  modalContent: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      delay: 0.1,
      type: "spring", 
      stiffness: 400, 
      damping: 25
    }
  }
};

// ========================================
// 🎨 TEMPLATES DE ESTILO PREMIUM (DESIGN_SYSTEM.md Spec)
// ========================================

// Template para Banner Premium
export const premiumBannerStyle = (theme) => ({
  background: primaryGradient(theme),
  color: 'white',
  p: 4,
  borderRadius: '16px 16px 0 0',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    zIndex: 1
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    ...floatEffect,
    zIndex: 1
  }
});

// Template para Botón Premium
export const premiumButtonStyle = (theme) => ({
  borderRadius: '12px',
  height: '48px',
  textTransform: 'none',
  fontWeight: 600,
  position: 'relative',
  overflow: 'hidden',
  background: primaryGradient(theme),
  boxShadow: `0 4px 15px ${theme.palette.primary.main}40`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'all 0.6s'
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${theme.palette.primary.main}50`,
    '&::before': {
      left: '100%'
    }
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
    '&:hover': {
      transform: 'none',
      boxShadow: `0 4px 15px ${theme.palette.primary.main}40`
    }
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
});

// Template para Paper Premium
export const premiumPaperStyle = (theme) => ({
  p: 2.5,
  borderRadius: 3,
  background: infoGradient(theme),
  border: `1px solid ${theme.palette.info.main}30`,
  position: 'relative',
  overflow: 'hidden',
  ...shimmerEffect
});

// Template para Dialog Premium
export const premiumDialogStyle = (theme) => ({
  borderRadius: 4,
  background: paperGradient(theme),
  boxShadow: `0 20px 60px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.15)'}`,
  border: `1px solid ${theme.palette.divider}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: primaryGradient(theme),
    borderRadius: '16px 16px 0 0'
  }
});

// ========================================
// 📏 ESPACIADO Y LAYOUT ESTÁNDAR (DESIGN_SYSTEM.md Spec)
// ========================================

export const spacing = {
  // Padding estándar
  paddingMain: 4,     // 32px - Para contenido principal
  paddingSection: 3,  // 24px - Para secciones
  paddingSmall: 2,    // 16px - Para elementos pequeños

  // Margins estándar
  marginSection: 3,   // 24px - Entre secciones
  marginElement: 1,   // 8px - Entre elementos relacionados

  // Gaps estándar
  gapElements: 2,     // 16px - Entre elementos en flex/grid
  gapMain: 3,         // 24px - Entre elementos principales

  // Border radius estándar
  radiusSmall: 2,     // 8px - Elementos pequeños
  radiusButton: 3,    // 12px - Botones y campos
  radiusPaper: 4,     // 16px - Modales y papers
  radiusCircle: '50%' // Círculos perfectos
};

// ========================================
// 🎨 UTILIDADES DE COLOR (DESIGN_SYSTEM.md Spec)
// ========================================

// Función para agregar transparencia a colores del tema
export const alpha = (color, opacity) => {
  // Si el color ya incluye alpha, lo extraemos
  if (color.includes('rgba')) {
    return color.replace(/,\s*[\d.]+\)/, `, ${opacity})`);
  }
  
  // Para colores hex, los convertimos a rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Para colores del tema, agregamos la transparencia
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Transparencias estándar
export const transparency = {
  light: '15',      // 15% - Fondos muy sutiles
  subtle: '30',     // 30% - Bordes y divisores
  medium: '40',     // 40% - Sombras
  strong: '50',     // 50% - Overlays
};

// ========================================
// 🏗️ SISTEMA DE ELEVACIONES (DESIGN_SYSTEM.md Spec)
// ========================================

export const elevations = {
  none: 0,       // Sin sombra (con border)
  subtle: 4,     // Sombra suave
  medium: 8,     // Sombra media  
  high: 12,      // Sombra pronunciada
  maximum: 24    // Sombra máxima (modales)
};

// ========================================
// 📝 TIPOGRAFÍA ESTÁNDAR (DESIGN_SYSTEM.md Spec)
// ========================================

export const typography = {
  // Títulos principales (Banners)
  heroTitle: {
    variant: "h5",
    sx: { fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }
  },
  
  // Subtítulos
  subtitle: {
    variant: "h6",
    sx: { fontWeight: 600 }
  },
  
  // Texto descriptivo
  body: {
    variant: "body1",
    sx: { opacity: 0.9, fontWeight: 500 }
  },
  
  // Texto secundario
  secondary: {
    variant: "body2",
    sx: { color: 'text.secondary' }
  },
  
  // Captions con peso
  caption: {
    variant: "caption",
    sx: { opacity: 0.9, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }
  }
};

// ========================================
// 🔧 UTILIDADES DE DESARROLLO
// ========================================

// Función para debugear estilos en desarrollo
export const debugStyle = (label) => {
  if (process.env.NODE_ENV === 'development') {
  }
  return {};
};

// Validador de props del design system
export const validateDesignSystemProps = (props, componentName) => {
  if (process.env.NODE_ENV === 'development') {
    const requiredProps = ['theme'];
    requiredProps.forEach(prop => {
      if (!props[prop]) {
      }
    });
  }
};

// ========================================
// 📋 EXPORT CONSOLIDADO
// ========================================

export default {
  // Gradientes
  gradients: {
    primary: primaryGradient,
    paper: paperGradient,
    info: infoGradient
  },
  
  // Efectos
  effects: {
    shimmer: shimmerEffect,
    pulse: pulseEffect,
    float: floatEffect
  },
  
  // Hooks
  hooks: {
    useThemeGradients
  },
  
  // Animaciones
  animations: animationVariants,
  
  // Templates
  templates: {
    premiumBanner: premiumBannerStyle,
    premiumButton: premiumButtonStyle,
    premiumPaper: premiumPaperStyle,
    premiumDialog: premiumDialogStyle
  },
  
  // Constantes
  spacing,
  elevations,
  typography,
  transparency,
  
  // Utilidades
  utils: {
    alpha,
    debugStyle,
    validateDesignSystemProps
  }
};