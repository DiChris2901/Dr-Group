/**
 * 🎨 DR Group Dashboard - Theme Configuration
 * Configuración centralizada del sistema de temas premium
 */

import { createTheme } from '@mui/material/styles';

// ========================================
// 🎯 PALETA DE COLORES BASE
// ========================================

export const colorPalette = {
  // Colores primarios empresariales
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Primary main
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1'
  },
  
  // Colores secundarios (complementarios)
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0', // Secondary main
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c'
  },
  
  // Sistema de grises premium
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  
  // Colores semánticos
  success: {
    light: '#81c784',
    main: '#4caf50',
    dark: '#388e3c'
  },
  
  warning: {
    light: '#ffb74d',
    main: '#ff9800',
    dark: '#f57c00'
  },
  
  error: {
    light: '#e57373',
    main: '#f44336',
    dark: '#d32f2f'
  },
  
  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2'
  }
};

// ========================================
// 🌙 CONFIGURACIÓN DE MODO OSCURO
// ========================================

export const darkModeColors = {
  primary: colorPalette.primary,
  secondary: colorPalette.secondary,
  background: {
    default: '#0a0a0a',
    paper: '#1a1a1a'
  },
  surface: {
    1: '#1e1e1e',
    2: '#222222',
    3: '#262626',
    4: '#2c2c2c',
    5: '#323232'
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)'
  }
};

// ========================================
// ☀️ CONFIGURACIÓN DE MODO CLARO
// ========================================

export const lightModeColors = {
  primary: colorPalette.primary,
  secondary: colorPalette.secondary,
  background: {
    default: '#fafafa',
    paper: '#ffffff'
  },
  surface: {
    1: '#ffffff',
    2: '#f8f9fa',
    3: '#f1f3f4',
    4: '#e8eaed',
    5: '#dadce0'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)'
  }
};

// ========================================
// 🎨 GRADIENTES PREMIUM
// ========================================

export const gradients = {
  // Gradiente principal de la marca
  primary: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
  
  // Gradientes de fondo para diferentes modos
  lightBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  darkBackground: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)',
  
  // Gradientes semánticos
  success: 'linear-gradient(135deg, #81c784 0%, #4caf50 100%)',
  warning: 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)',
  error: 'linear-gradient(135deg, #e57373 0%, #f44336 100%)',
  info: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
  
  // Gradientes sutiles para overlays
  infoOverlay: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
  warningOverlay: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
  successOverlay: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
  errorOverlay: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)'
};

// ========================================
// 📐 SPACING Y DIMENSIONES
// ========================================

export const spacing = {
  // Espaciado base (múltiplos de 8px)
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 16,  // 16px
  lg: 24,  // 24px
  xl: 32,  // 32px
  xxl: 48, // 48px
  
  // Espaciado específico para componentes
  component: {
    padding: {
      small: 12,
      medium: 16,
      large: 24,
      xlarge: 32
    },
    margin: {
      small: 8,
      medium: 16,
      large: 24,
      xlarge: 32
    },
    gap: {
      small: 8,
      medium: 16,
      large: 24
    }
  },
  
  // Border radius estándar
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    round: '50%'
  }
};

// ========================================
// 🎭 SOMBRAS PREMIUM
// ========================================

export const shadows = {
  // Sombras estándar
  none: 'none',
  soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  strong: '0 8px 24px rgba(0, 0, 0, 0.2)',
  modal: '0 24px 48px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
  
  // Sombras con color (para botones y elementos interactivos)
  colored: {
    primary: '0 4px 15px rgba(33, 150, 243, 0.4)',
    primaryHover: '0 8px 25px rgba(33, 150, 243, 0.5)',
    secondary: '0 4px 12px rgba(156, 39, 176, 0.3)',
    success: '0 4px 12px rgba(76, 175, 80, 0.3)',
    warning: '0 4px 12px rgba(255, 152, 0, 0.3)',
    error: '0 4px 12px rgba(244, 67, 54, 0.3)',
    info: '0 4px 12px rgba(33, 150, 243, 0.3)'
  }
};

// ========================================
// 📝 TIPOGRAFÍA
// ========================================

export const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),
  
  // Pesos de fuente
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800
  },
  
  // Jerarquía de tamaños
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem'     // 48px
  }
};

// ========================================
// 🎬 TRANSICIONES Y ANIMACIONES
// ========================================

export const transitions = {
  // Duraciones estándar
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  
  // Easing curves premium
  easing: {
    // Material Design standard curves
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    
    // Custom premium curves
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
};

// ========================================
// 🎨 TEMA PRINCIPAL CONFIGURADO
// ========================================

export const createDRGroupTheme = (mode = 'light') => {
  const isLight = mode === 'light';
  const colors = isLight ? lightModeColors : darkModeColors;
  
  return createTheme({
    palette: {
      mode,
      ...colors,
      // Colores adicionales personalizados
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        selected: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
        disabled: isLight ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
        disabledBackground: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'
      }
    },
    
    typography: {
      fontFamily: typography.fontFamily,
      h1: { fontWeight: typography.fontWeight.extraBold, fontSize: typography.fontSize['5xl'] },
      h2: { fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize['4xl'] },
      h3: { fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize['3xl'] },
      h4: { fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize['2xl'] },
      h5: { fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.xl },
      h6: { fontWeight: typography.fontWeight.semiBold, fontSize: typography.fontSize.lg },
      subtitle1: { fontWeight: typography.fontWeight.semiBold },
      subtitle2: { fontWeight: typography.fontWeight.medium },
      body1: { fontSize: typography.fontSize.base },
      body2: { fontSize: typography.fontSize.sm },
      button: { fontWeight: typography.fontWeight.semiBold, textTransform: 'none' },
      caption: { fontSize: typography.fontSize.xs },
      overline: { fontSize: typography.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em' }
    },
    
    spacing: (factor) => spacing.xs * 2 * factor, // 8px base
    
    shape: {
      borderRadius: spacing.borderRadius.medium
    },
    
    shadows: [
      shadows.none,
      shadows.soft,
      shadows.soft,
      shadows.soft,
      shadows.medium,
      shadows.medium,
      shadows.medium,
      shadows.medium,
      shadows.strong,
      shadows.strong,
      shadows.strong,
      shadows.strong,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal,
      shadows.modal
    ],
    
    transitions: {
      duration: transitions.duration,
      easing: transitions.easing
    },
    
    components: {
      // Personalización global de componentes MUI
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: spacing.borderRadius.medium,
            textTransform: 'none',
            fontWeight: typography.fontWeight.semiBold,
            transition: `all ${transitions.duration.standard}ms ${transitions.easing.standard}`
          }
        }
      },
      
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: spacing.borderRadius.medium
            }
          }
        }
      }
    }
  });
};

// ========================================
// 🔧 UTILIDADES DE TEMA
// ========================================

export const themeUtils = {
  // Generar gradiente dinámico
  getDynamicGradient: (theme, type = 'primary') => {
    switch (type) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`;
      case 'background':
        return theme.palette.mode === 'dark' ? gradients.darkBackground : gradients.lightBackground;
      case 'info':
        return gradients.infoOverlay;
      case 'warning':
        return gradients.warningOverlay;
      case 'success':
        return gradients.successOverlay;
      case 'error':
        return gradients.errorOverlay;
      default:
        return gradients.primary;
    }
  },
  
  // Generar sombra con color
  getColoredShadow: (theme, color = 'primary', intensity = 0.4) => {
    return `0 4px 15px ${theme.palette[color].main}${Math.round(intensity * 255).toString(16)}`;
  },
  
  // Generar border con transparencia
  getThemedBorder: (theme, color = 'primary', opacity = 0.3) => {
    return `1px solid ${theme.palette[color].main}${Math.round(opacity * 255).toString(16)}`;
  },
  
  // Obtener color con transparencia
  withOpacity: (color, opacity) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  }
};

export default {
  createDRGroupTheme,
  colorPalette,
  gradients,
  spacing,
  shadows,
  typography,
  transitions,
  themeUtils
};